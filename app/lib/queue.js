// Global concurrency gate for expensive download jobs.
// Limits simultaneous yt-dlp processes and bounds the waiting queue so a
// traffic spike can't fork unlimited subprocesses.

import { LIMITS } from "./limits";

let active = 0;
let waiting = 0;
const queue = [];

function next() {
  if (queue.length === 0 || active >= LIMITS.maxConcurrentDownloads) return;
  const entry = queue.shift();
  waiting--;
  entry.done = true;
  clearTimeout(entry.timer);
  entry.signal?.removeEventListener("abort", entry.abort);
  active++;
  entry.resolve(createRelease());
}

function createRelease() {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    active = Math.max(0, active - 1);
    next();
  };
}

/**
 * Acquire a slot. Resolves with a release() fn, or rejects with a `busy`
 * error if the queue is already full.
 */
export function acquireSlot({ signal, timeoutMs = 15_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const e = new Error("aborted");
      e.code = "aborted";
      reject(e);
      return;
    }
    if (active < LIMITS.maxConcurrentDownloads) {
      active++;
      resolve(createRelease());
      return;
    }
    if (waiting >= LIMITS.maxQueue) {
      const e = new Error("busy");
      e.code = "busy";
      reject(e);
      return;
    }
    waiting++;
    const entry = { resolve, reject, signal, done: false, timer: null, abort: null };
    const cancel = (code) => {
      if (entry.done) return;
      entry.done = true;
      const index = queue.indexOf(entry);
      if (index >= 0) {
        queue.splice(index, 1);
        waiting--;
      }
      clearTimeout(entry.timer);
      signal?.removeEventListener("abort", entry.abort);
      const e = new Error(code);
      e.code = code;
      reject(e);
    };
    entry.abort = () => cancel("aborted");
    entry.timer = setTimeout(() => cancel("busy"), timeoutMs);
    signal?.addEventListener("abort", entry.abort, { once: true });
    queue.push(entry);
  });
}

export function stats() {
  return { active, waiting };
}
