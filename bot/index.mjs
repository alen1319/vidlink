/**
 * Vidlink Telegram bot.
 *
 * Long-polls getUpdates (no webhook, so it works behind Cloudflare/firewalls),
 * parses a pasted URL with yt-dlp, offers quality buttons, then uploads the
 * file to the chat. Files above Telegram's bot upload limit fall back to a
 * direct download link on the website.
 *
 * Zero npm deps: Node 22 native fetch/FormData/Blob + spawned yt-dlp.
 */
import { spawn } from "node:child_process";
import { mkdtemp, readdir, rm, stat, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { isSupportedUrl, parseDownloadCallback } from "./validation.mjs";
import { createConcurrencyGate, createJobStore, createRateLimiter, shouldUseBrowserDownload } from "./runtime.mjs";

const TOKEN = process.env.BOT_TOKEN || "";
const API = `https://api.telegram.org/bot${TOKEN}`;
const SITE_URL = process.env.SITE_URL || "https://vidlink.app";
const MINIAPP_URL = process.env.MINIAPP_URL || "https://bot.vidlink.app";
const YT_DLP = process.env.YT_DLP_PATH || "yt-dlp";
// Telegram bot API caps uploads at 50 MB.
const TG_UPLOAD_LIMIT = 50 * 1024 * 1024;
const DOWNLOAD_LIMIT = 49 * 1024 * 1024;
const DL_TIMEOUT_MS = 8 * 60 * 1000;
const MAX_DURATION_SEC = 3 * 60 * 60;
const MAX_PROCESS_OUTPUT = 4 * 1024 * 1024;
const MAX_ACTIVE_MEDIA = Math.min(2, Math.max(1, Number(process.env.BOT_MAX_CONCURRENT) || 2));
const mediaGate = createConcurrencyGate(MAX_ACTIVE_MEDIA);
const telegramGate = createConcurrencyGate(8);
const rateLimiter = createRateLimiter({ limit: 6, windowMs: 60_000, maxEntries: 5000 });
const jobs = createJobStore({ maxEntries: 500, ttlMs: 3600_000 });

if (!TOKEN) {
  console.error("BOT_TOKEN is not set — refusing to start.");
  process.exit(1);
}

function cookieArgs() {
  const p = process.env.YT_DLP_COOKIES || "";
  return p && existsSync(p) ? ["--cookies", p] : [];
}

// Mirrors app/lib/ytdlp.js: PO token provider is what gets YouTube working
// from a datacenter IP. No-op unless the provider service is configured.
function potArgs() {
  const baseUrl = process.env.YT_DLP_POT_PROVIDER_URL || "";
  if (baseUrl !== "http://pot-provider:4416") return [];
  return [
    "--js-runtimes", "node",
    "--extractor-args", `youtubepot-bgutilhttp:base_url=${baseUrl}`,
    "--extractor-args", "youtube:player_client=mweb",
  ];
}

const authArgs = () => [...cookieArgs(), ...potArgs()];

/** Call a Telegram Bot API method with a JSON body. */
async function tg(method, payload) {
  const release = telegramGate.acquire();
  if (!release) throw new Error("Telegram API busy");
  try {
    const res = await fetch(`${API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(`Telegram ${method} failed`);
    return json;
  } finally {
    release();
  }
}

/** Run yt-dlp, resolve stdout. */
function runYtDlp(args, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const child = spawn(YT_DLP, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });
    let out = "", err = "";
    let settled = false;
    const killTree = () => {
      try {
        if (process.platform !== "win32") process.kill(-child.pid, "SIGKILL");
        else child.kill("SIGKILL");
      } catch {}
    };
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const timer = setTimeout(() => {
      killTree();
      finish(reject, new Error("timeout"));
    }, timeoutMs);
    const append = (current, chunk) => (current + chunk).slice(-MAX_PROCESS_OUTPUT);
    child.stdout.on("data", (d) => (out = append(out, d)));
    child.stderr.on("data", (d) => (err = append(err, d)));
    child.on("error", (e) => finish(reject, e));
    child.on("close", (c) => {
      c === 0
        ? finish(resolve, out)
        : finish(reject, new Error(err.trim().split("\n").pop() || `exit ${c}`));
    });
  });
}

const humanSize = (b) => (!b || b <= 0 ? null : b / 1048576 >= 1024 ? (b / 1073741824).toFixed(2) + " GB" : (b / 1048576).toFixed(1) + " MB");
const humanDur = (s) => {
  if (!s) return "";
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(x)}` : `${m}:${p(x)}`;
};

/** Parse a URL into title + tiered quality options. */
async function parse(url) {
  const info = JSON.parse(await runYtDlp([
    "-J", "--no-playlist", "--no-warnings",
    "--match-filter", `duration < ${MAX_DURATION_SEC}`,
    ...authArgs(), url,
  ]));
  const formats = info.formats || [];
  const audio = formats.filter((f) => f.vcodec === "none" && f.acodec !== "none")
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
  const audioSize = audio?.filesize || audio?.filesize_approx || 0;
  const videos = formats.filter((f) => f.vcodec && f.vcodec !== "none" && f.height > 0);
  const maxH = videos.reduce((m, f) => Math.max(m, f.height), 0);

  const opts = [];
  for (const h of [1080, 720, 480, 360]) {
    if (maxH < h) continue;
    const vf = videos.filter((f) => f.height <= h).sort((a, b) => b.height - a.height)[0];
    if (!vf || opts.some((o) => o.height === vf.height)) continue;
    let size = vf.filesize || vf.filesize_approx || 0;
    if (vf.acodec === "none" && audioSize) size += audioSize;
    opts.push({ label: `${vf.height}p`, sel: String(h), height: vf.height, size });
  }
  opts.push({ label: "MP3", sel: "mp3", height: 0, size: audioSize });

  return {
    title: info.title || "Untitled",
    uploader: info.uploader || info.channel || "",
    duration: humanDur(info.duration),
    webpageUrl: info.webpage_url || url,
    options: opts,
  };
}

/** Download one quality to a temp dir; returns {filePath, dir, ext}. */
async function download(url, sel) {
  const dir = await mkdtemp(path.join(tmpdir(), "vlbot-"));
  const isAudio = sel === "mp3";
  const args = [
    "--no-playlist", "--no-warnings", "--no-part",
    "--retries", "3", "--socket-timeout", "30",
    "--max-filesize", String(DOWNLOAD_LIMIT),
    "--match-filter", `duration < ${MAX_DURATION_SEC}`,
    ...authArgs(),
    "-o", path.join(dir, "media.%(ext)s"),
  ];
  if (isAudio) args.push("-f", "ba/b", "-x", "--audio-format", "mp3", "--audio-quality", "0");
  else args.push("-f", `bv*[height<=${sel}]+ba/b[height<=${sel}]/b`, "--merge-output-format", "mp4");
  args.push(url);

  try {
    await runYtDlp(args, DL_TIMEOUT_MS);
    const file = (await readdir(dir)).find((f) => f.startsWith("media."));
    if (!file) throw new Error("no output");
    return { filePath: path.join(dir, file), dir, ext: path.extname(file).slice(1) };
  } catch (error) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

/** Upload a local file to the chat as video or audio. */
async function sendFile(chatId, filePath, ext, caption) {
  const isAudio = ext === "mp3";
  const buf = await readFile(filePath);
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption.slice(0, 1000));
  form.append(
    isAudio ? "audio" : "video",
    new Blob([buf], { type: isAudio ? "audio/mpeg" : "video/mp4" }),
    `vidlink.${ext}`
  );
  if (!isAudio) form.append("supports_streaming", "true");
  const release = telegramGate.acquire();
  if (!release) throw new Error("Telegram API busy");
  try {
    const res = await fetch(`${API}/${isAudio ? "sendAudio" : "sendVideo"}`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(5 * 60_000),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error("Telegram upload failed");
  } finally {
    release();
  }
}

async function onMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || chatId;
  const text = (msg.text || "").trim();

  if (!rateLimiter.allow(userId)) return;

  if (text.startsWith("/start")) {
    return tg("sendMessage", {
      chat_id: chatId,
      text:
        "👋 *Vidlink* — 粘贴任意视频链接，我来帮你下载。\n\n" +
        "支持 YouTube、TikTok/抖音、Instagram、X、Facebook、Bilibili 等。\n" +
        "直接发链接给我，或点下方按钮打开小程序。",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "🎬 打开 Vidlink 小程序", web_app: { url: MINIAPP_URL } }]],
      },
    });
  }

  if (!isSupportedUrl(text)) {
    return tg("sendMessage", { chat_id: chatId, text: "请发送受支持平台的公开视频链接。" });
  }
  const wait = await tg("sendMessage", { chat_id: chatId, text: "🔎 正在解析…" });
  const waitId = wait.result?.message_id;
  const release = mediaGate.acquire();
  if (!release) {
    return tg("editMessageText", { chat_id: chatId, message_id: waitId, text: "当前任务较多，请稍后再试。" });
  }

  try {
    const r = await parse(text);
    if (!isSupportedUrl(r.webpageUrl)) throw new Error("unsafe canonical URL");
    const id = jobs.put({
      url: r.webpageUrl,
      title: r.title,
      chatId,
      userId,
      sizes: Object.fromEntries(r.options.map((option) => [option.sel, option.size || 0])),
    });
    const rows = r.options.map((o) => [{
      text: `${o.label}${o.size ? " · " + humanSize(o.size) : ""}`,
      callback_data: `d:${id}:${o.sel}`,
    }]);
    await tg("editMessageText", {
      chat_id: chatId,
      message_id: waitId,
      text: `🎬 ${r.title}\n${r.uploader}${r.duration ? " · " + r.duration : ""}\n\n请选择清晰度：`,
      reply_markup: { inline_keyboard: rows },
    });
  } catch (e) {
    const m = String(e.message || e);
    const bot = /not a bot|Sign in to confirm/i.test(m);
    await tg("editMessageText", {
      chat_id: chatId,
      message_id: waitId,
      text: bot
        ? "❌ 该平台目前拒绝了服务器的请求（YouTube 对机房 IP 的限制）。请稍后再试或换其它平台链接。"
        : "❌ 解析失败，请检查链接是否正确、是否为公开视频。",
    });
  } finally {
    release();
  }
}

async function onCallback(cb) {
  const chatId = cb.message?.chat?.id;
  const userId = cb.from?.id || chatId;
  const parsed = parseDownloadCallback(cb.data);
  await tg("answerCallbackQuery", { callback_query_id: cb.id });
  if (!chatId || !parsed) return;
  if (!rateLimiter.allow(userId)) return;
  const release = mediaGate.acquire();
  if (!release) {
    return tg("sendMessage", { chat_id: chatId, text: "当前任务较多，请稍后再试。" });
  }
  const job = jobs.consume(parsed.id, chatId, userId);
  if (!job) {
    release();
    return tg("sendMessage", { chat_id: chatId, text: "该任务已过期，请重新发送链接。" });
  }
  const sel = parsed.selector;
  const estimatedSize = job.sizes?.[sel] || 0;
  if (shouldUseBrowserDownload(estimatedSize, DOWNLOAD_LIMIT)) {
    release();
    const link = `${SITE_URL}/api/download?url=${encodeURIComponent(job.url)}&quality=${sel}&title=${encodeURIComponent(job.title)}`;
    return tg("sendMessage", {
      chat_id: chatId,
      text: estimatedSize
        ? `⚠️ 文件约 ${humanSize(estimatedSize)}，请使用浏览器下载。`
        : "文件大小暂时无法确认，请使用浏览器安全下载。",
      reply_markup: { inline_keyboard: [[{ text: "⬇️ 浏览器下载", url: link }]] },
    });
  }

  const wait = await tg("sendMessage", { chat_id: chatId, text: "⬇️ 正在下载，请稍候…" }).catch((error) => {
    release();
    throw error;
  });
  const waitId = wait.result?.message_id;
  let dir;
  try {
    const r = await download(job.url, sel);
    dir = r.dir;
    const size = (await stat(r.filePath)).size;

    if (size > TG_UPLOAD_LIMIT) {
      // Too big for the bot API — hand back a direct link instead.
      const link = `${SITE_URL}/api/download?url=${encodeURIComponent(job.url)}&quality=${sel}&title=${encodeURIComponent(job.title)}`;
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: waitId,
        text: `⚠️ 文件 ${humanSize(size)}，超过 Telegram 机器人 50MB 上传上限。\n\n请用浏览器下载：`,
        reply_markup: { inline_keyboard: [[{ text: "⬇️ 浏览器下载", url: link }]] },
      });
    } else {
      await tg("editMessageText", { chat_id: chatId, message_id: waitId, text: "📤 正在上传到 Telegram…" });
      await sendFile(chatId, r.filePath, r.ext, job.title);
      await tg("deleteMessage", { chat_id: chatId, message_id: waitId });
    }
  } catch (e) {
    console.error("download failed");
    const link = `${SITE_URL}/api/download?url=${encodeURIComponent(job.url)}&quality=${sel}&title=${encodeURIComponent(job.title)}`;
    await tg("editMessageText", {
      chat_id: chatId,
      message_id: waitId,
      text: "机器人内下载失败，请改用浏览器下载。",
      reply_markup: { inline_keyboard: [[{ text: "⬇️ 浏览器下载", url: link }]] },
    });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
    release();
  }
}

async function main() {
  await tg("deleteWebhook", { drop_pending_updates: false });
  const me = await tg("getMe", {});
  console.log("Vidlink bot online:", me.result?.username);
  await writeFile("/tmp/bot.ready", String(Date.now()));
  let offset = 0;
  for (;;) {
    try {
      const res = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`, {
        signal: AbortSignal.timeout(40_000),
      });
      const json = await res.json();
      if (!json.ok) {
        console.error("Telegram polling rejected; exiting for container restart");
        process.exit(1);
      }
      await writeFile("/tmp/bot.ready", String(Date.now()));
      for (const u of json.result) {
        offset = u.update_id + 1;
        // Handle each update independently so one failure can't stall polling.
        if (u.message) onMessage(u.message).catch((e) => console.error("msg:", e.message));
        else if (u.callback_query) onCallback(u.callback_query).catch((e) => console.error("cb:", e.message));
      }
    } catch (e) {
      console.error("poll error:", e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main();
