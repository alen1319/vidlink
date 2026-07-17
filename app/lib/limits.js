// Central place for anti-abuse limits. All overridable via env.

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

export const LIMITS = {
  // Max video duration allowed for download (seconds). Default 3h.
  maxDurationSec: num(process.env.MAX_DURATION_SEC, 3 * 3600),
  // Hard cap passed to yt-dlp --max-filesize. Default 2GB.
  maxFilesize: process.env.MAX_FILESIZE || "2G",
  // Concurrent downloads across the whole process.
  maxConcurrentDownloads: num(process.env.MAX_CONCURRENT_DOWNLOADS, 3),
  // Extra requests allowed to wait for a slot before we return 503.
  maxQueue: num(process.env.MAX_DOWNLOAD_QUEUE, 12),
  // Rate limits (requests per window per IP).
  parse: {
    windowMs: num(process.env.PARSE_RATE_WINDOW_MS, 60_000),
    max: num(process.env.PARSE_RATE_MAX, 20),
  },
  download: {
    windowMs: num(process.env.DL_RATE_WINDOW_MS, 60_000),
    max: num(process.env.DL_RATE_MAX, 8),
  },
};

/** Extract the best-guess client IP from proxy headers. */
export function clientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
