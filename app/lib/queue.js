// Global concurrency gate for expensive download jobs.
// Limits simultaneous yt-dlp processes and bounds the waiting queue so a
// traffic spike can't fork unlimited subprocesses.

import { LIMITS } from "./limits";

let active = 0;
let waiting = 0;
const queue = [];

function next() {
  if (queue.length === 0 || active >= LIMITS.maxConcurrentDownloads) return;
  active++;
  const resolve = queue.shift();
  waiting--;
  resolve();
}

/**
 * Acquire a slot. Resolves with a release() fn, or rejects with a `busy`
 * error if the queue is already full.
 */
export function acquireSlot() {
  return new Promise((resolve, reject) => {
    if (active < LIMITS.maxConcurrentDownloads) {
      active++;
      resolve(release);
      return;
    }
    if (waiting >= LIMITS.maxQueue) {
      const e = new Error("busy");
      e.code = "busy";
      reject(e);
      return;
    }
    waiting++;
    queue.push(() => resolve(release));
  });
}

function release() {
  active = Math.max(0, active - 1);
  next();
}

export function stats() {
  return { active, waiting };
}
