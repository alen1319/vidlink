import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

// Resolve the yt-dlp binary. Override with env YT_DLP_PATH if needed.
export const YT_DLP = process.env.YT_DLP_PATH || "yt-dlp";

// Optional cookies file (Netscape format) to authenticate with sites that
// block datacenter IPs (notably YouTube). Set YT_DLP_COOKIES to its path.
// Returns [] when unset/missing so behaviour is unchanged without cookies.
export function cookieArgs() {
  const p = process.env.YT_DLP_COOKIES || "";
  return p && existsSync(p) ? ["--cookies", p] : [];
}

// Point the bgutil PO-token plugin at its provider service. YouTube demands a
// PO token from datacenter IPs ("Sign in to confirm you're not a bot"); this is
// what lets the server fetch one. No-op when the provider isn't configured.
export function potArgs() {
  const baseUrl = process.env.YT_DLP_POT_PROVIDER_URL || "";
  if (baseUrl !== "http://pot-provider:4416") return [];
  return [
    "--js-runtimes", "node",
    "--extractor-args", `youtubepot-bgutilhttp:base_url=${baseUrl}`,
    "--extractor-args", "youtube:player_client=mweb",
  ];
}

/**
 * Run yt-dlp and collect stdout. Rejects on non-zero exit.
 * @param {string[]} args
 * @param {{timeoutMs?: number}} opts
 */
export function runYtDlp(args, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 30000;
  const signal = opts.signal;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("yt-dlp aborted"));
      return;
    }
    const child = spawn(YT_DLP, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });
    let out = "";
    let err = "";
    const kill = () => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    };
    const onAbort = () => {
      clearTimeout(timer);
      kill();
      reject(new Error("yt-dlp aborted"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      kill();
      reject(new Error("yt-dlp timed out"));
    }, timeoutMs);
    signal?.addEventListener("abort", onAbort, { once: true });

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (code === 0) resolve(out);
      else reject(new Error(err.trim() || `yt-dlp exited with code ${code}`));
    });
  });
}

/** Fetch metadata JSON for a single video URL. */
export async function fetchInfo(url, opts = {}) {
  const json = await runYtDlp([
    "-J",
    "--no-playlist",
    "--no-warnings",
    ...cookieArgs(),
    ...potArgs(),
    url,
  ], opts);
  return JSON.parse(json);
}

const SOURCE_LABEL = {
  Youtube: "YouTube", YouTube: "YouTube", TikTok: "TikTok", Instagram: "Instagram",
  Twitter: "Twitter / X", Facebook: "Facebook", BiliBili: "Bilibili", Bilibili: "Bilibili",
  Vimeo: "Vimeo", Twitch: "Twitch", Soundcloud: "SoundCloud", Dailymotion: "Dailymotion",
};

export function humanSize(bytes) {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return (mb / 1024).toFixed(2) + " GB";
  return mb.toFixed(1) + " MB";
}

export function humanDuration(sec) {
  if (!sec && sec !== 0) return "";
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function humanViews(n, lang) {
  if (!n && n !== 0) return "";
  const formatted = n.toLocaleString("en-US");
  return lang === "zh" ? `${formatted} 次观看` : `${formatted} views`;
}

/**
 * Build a clean download-options payload from yt-dlp info.
 * Returns tiered qualities (1080/720/480/360 as available) + MP3.
 */
export function buildResult(info, lang = "en") {
  const formats = Array.isArray(info.formats) ? info.formats : [];
  const duration = info.duration || 0;

  // Best audio format (for size estimation of video+audio merges).
  const audioOnly = formats.filter((f) => f.vcodec === "none" && f.acodec !== "none");
  const bestAudio = audioOnly.sort(
    (a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0)
  )[0];
  const audioSize =
    bestAudio?.filesize ||
    bestAudio?.filesize_approx ||
    (bestAudio?.tbr && duration ? (bestAudio.tbr * 1000 * duration) / 8 : 0);

  // Video formats grouped by height.
  const videoFormats = formats.filter(
    (f) => f.vcodec && f.vcodec !== "none" && (f.height || 0) > 0
  );
  const maxHeight = videoFormats.reduce((m, f) => Math.max(m, f.height || 0), 0);

  const tiers = [1080, 720, 480, 360];
  const qualities = [];

  for (const h of tiers) {
    if (maxHeight < h && !(h === 360 && maxHeight > 0 && qualities.length === 0)) {
      // Skip tiers above what's available (but always keep at least one tier).
      if (maxHeight < h) continue;
    }
    // Pick the best video format at or just below this tier height.
    const candidates = videoFormats
      .filter((f) => f.height <= h)
      .sort((a, b) => (b.height - a.height) || ((b.tbr || 0) - (a.tbr || 0)));
    const vf = candidates[0];
    if (!vf) continue;
    // Avoid duplicate tiers that resolve to the same actual height.
    if (qualities.some((q) => q._height === vf.height)) continue;

    const progressive = vf.acodec && vf.acodec !== "none";
    let size =
      vf.filesize ||
      vf.filesize_approx ||
      (vf.tbr && duration ? (vf.tbr * 1000 * duration) / 8 : 0);
    if (!progressive && audioSize) size += audioSize;

    const notes = {
      1080: lang === "zh" ? "全高清 · 含音频" : "Full HD · with audio",
      720: lang === "zh" ? "高清 · 推荐" : "HD · recommended",
      480: lang === "zh" ? "标清 · 省流量" : "SD · data saver",
      360: lang === "zh" ? "流畅 · 最省流量" : "Low · smallest",
    };

    qualities.push({
      quality: `${vf.height}p`,
      _height: vf.height,
      ext: "MP4",
      note: notes[h] || (lang === "zh" ? "视频" : "Video"),
      size: humanSize(size) || "—",
      kind: "video",
      selector: String(h),
    });
  }

  // Always offer MP3 (audio extraction).
  qualities.push({
    quality: "MP3",
    ext: "AUDIO",
    note: lang === "zh" ? "仅音频 · 320kbps" : "Audio only · 320kbps",
    size: humanSize(audioSize) || "—",
    kind: "audio",
    selector: "mp3",
  });

  const rawSource = info.extractor_key || info.extractor || "";
  const source =
    SOURCE_LABEL[rawSource] ||
    (rawSource ? rawSource.replace(/([a-z])([A-Z])/g, "$1 $2") : "Video");

  return {
    source,
    duration: humanDuration(duration),
    title: info.title || info.id || "Untitled",
    author: info.uploader || info.channel || info.uploader_id || "",
    views: humanViews(info.view_count, lang),
    thumbnail: info.thumbnail || null,
    webpageUrl: info.webpage_url || info.original_url || "",
    formats: qualities.map(({ _height, ...q }) => q),
  };
}

/** Map a quality selector to a yt-dlp -f format string. */
export function formatSelector(selector) {
  if (selector === "mp3") return null; // handled via -x
  const h = parseInt(selector, 10);
  if (!Number.isFinite(h)) return "bv*+ba/b";
  return `bv*[height<=${h}]+ba/b[height<=${h}]`;
}

const SUPPORTED_HOSTS = [
  "youtube.com", "youtu.be", "tiktok.com", "instagram.com",
  "twitter.com", "x.com", "facebook.com", "fb.watch",
  "bilibili.com", "b23.tv", "vimeo.com", "twitch.tv",
  "soundcloud.com", "dailymotion.com",
];

/** Accept only public URLs on explicitly supported video platforms. */
export function isValidUrl(url) {
  try {
    if (typeof url !== "string" || url.length > 2048) return false;
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (u.username || u.password || u.port) return false;
    const hostname = u.hostname.toLowerCase().replace(/\.$/, "");
    return SUPPORTED_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

/** Make a filesystem/header-safe filename. */
export function safeName(name) {
  return (name || "video")
    .replace(/[\\/:*?"<>| -]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "video";
}
