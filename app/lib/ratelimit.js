// Tiny in-process sliding-window rate limiter.
// Fine for a single Node process (pm2/systemd/docker). For multi-instance
// deployments, swap the Map for Redis with the same interface.

const buckets = new Map(); // key -> number[] (timestamps, ms)

let lastSweep = 0;
function sweep(now, windowMs) {
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  for (const [key, arr] of buckets) {
    const fresh = arr.filter((t) => now - t < windowMs);
    if (fresh.length) buckets.set(key, fresh);
    else buckets.delete(key);
  }
}

/**
 * @returns {{ ok: boolean, retryAfter: number }} retryAfter in seconds.
 */
export function rateLimit(key, { windowMs, max }, now = Date.now()) {
  sweep(now, windowMs);
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    const retryAfter = Math.max(1, Math.ceil((arr[0] + windowMs - now) / 1000));
    buckets.set(key, arr);
    return { ok: false, retryAfter };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true, retryAfter: 0 };
}
