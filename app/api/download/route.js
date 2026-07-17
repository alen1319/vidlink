import { spawn } from "node:child_process";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { tmpdir } from "node:os";
import path from "node:path";
import { YT_DLP, formatSelector, isValidUrl, safeName } from "@/app/lib/ytdlp";
import { rateLimit } from "@/app/lib/ratelimit";
import { acquireSlot } from "@/app/lib/queue";
import { LIMITS, clientIp } from "@/app/lib/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes hard cap

export async function GET(req) {
  const ip = clientIp(req);
  const rl = rateLimit(`dl:${ip}`, LIMITS.download);
  if (!rl.ok) {
    return new Response("rate_limited", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  const { searchParams } = new URL(req.url);
  const url = (searchParams.get("url") || "").trim();
  const selector = searchParams.get("quality") || "720";
  const title = searchParams.get("title") || "video";

  if (!url || !isValidUrl(url)) {
    return new Response("invalid_url", { status: 400 });
  }

  // Bound total concurrent downloads; reject fast when the queue is full.
  let release;
  try {
    release = await acquireSlot();
  } catch (e) {
    if (e?.code === "busy") {
      return new Response("busy", { status: 503, headers: { "Retry-After": "20" } });
    }
    throw e;
  }

  const isAudio = selector === "mp3";
  const dir = await mkdtemp(path.join(tmpdir(), "vidlink-"));
  const outTemplate = path.join(dir, "media.%(ext)s");

  const args = [
    "--no-playlist",
    "--no-warnings",
    "--no-check-certificate",
    "--no-part",
    "--retries", "3",
    "--socket-timeout", "30",
    "--max-filesize", LIMITS.maxFilesize,
    "--match-filter", `duration < ${LIMITS.maxDurationSec}`,
    "-o", outTemplate,
  ];

  if (isAudio) {
    args.push("-f", "ba/b", "-x", "--audio-format", "mp3", "--audio-quality", "0");
  } else {
    args.push("-f", formatSelector(selector), "--merge-output-format", "mp4");
  }
  args.push(url);

  try {
    await runDownload(args, DOWNLOAD_TIMEOUT_MS);
  } catch (e) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
    release();
    return new Response("download_failed: " + String(e?.message || e).slice(0, 200), {
      status: 502,
    });
  }

  // Locate the produced file.
  let files;
  try {
    files = await readdir(dir);
  } catch {
    release();
    return new Response("download_failed", { status: 502 });
  }
  const produced = files.find((f) => f.startsWith("media."));
  if (!produced) {
    // Most likely the --max-filesize / --match-filter guard rejected it.
    await rm(dir, { recursive: true, force: true }).catch(() => {});
    release();
    return new Response("rejected: file exceeds limits or was filtered", { status: 413 });
  }

  const filePath = path.join(dir, produced);
  const ext = path.extname(produced).slice(1) || (isAudio ? "mp3" : "mp4");
  const size = (await stat(filePath)).size;
  const filename = `${safeName(title)}.${ext}`;

  const contentType = isAudio
    ? "audio/mpeg"
    : ext === "mp4"
    ? "video/mp4"
    : "application/octet-stream";

  // Stream the file, then release the slot and clean up the temp dir.
  const nodeStream = createReadStream(filePath);
  const cleanup = () => {
    rm(dir, { recursive: true, force: true }).catch(() => {});
    release();
  };
  nodeStream.on("close", cleanup);
  nodeStream.on("error", cleanup);
  const webStream = Readable.toWeb(nodeStream);

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}

function runDownload(args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(YT_DLP, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("download timed out"));
    }, timeoutMs);
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(err.trim().split("\n").pop() || `exit ${code}`));
    });
  });
}
