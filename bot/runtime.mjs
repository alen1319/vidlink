export function createConcurrencyGate(limit) {
  let active = 0;
  return {
    acquire() {
      if (active >= limit) return null;
      active += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        active -= 1;
      };
    },
  };
}

export function createRateLimiter({ limit, windowMs, maxEntries, now = Date.now }) {
  const attempts = new Map();
  const prune = (current) => {
    for (const [key, values] of attempts) {
      const recent = values.filter((time) => current - time < windowMs);
      if (recent.length) attempts.set(key, recent);
      else attempts.delete(key);
    }
    while (attempts.size >= maxEntries) attempts.delete(attempts.keys().next().value);
  };
  return {
    allow(key) {
      const current = now();
      if (!attempts.has(key) && attempts.size >= maxEntries) prune(current);
      const recent = (attempts.get(key) || []).filter((time) => current - time < windowMs);
      if (recent.length >= limit) return false;
      attempts.set(key, [...recent, current]);
      return true;
    },
    size: () => attempts.size,
  };
}

export function createJobStore({ maxEntries, ttlMs, now = Date.now }) {
  const jobs = new Map();
  let sequence = 0;
  const prune = () => {
    const current = now();
    for (const [id, job] of jobs) if (current - job.at > ttlMs) jobs.delete(id);
    while (jobs.size >= maxEntries) jobs.delete(jobs.keys().next().value);
  };
  return {
    put(job) {
      prune();
      const id = String(++sequence);
      jobs.set(id, { ...job, at: now() });
      return id;
    },
    consume(id, chatId, userId) {
      const job = jobs.get(id);
      if (!job || now() - job.at > ttlMs || job.chatId !== chatId || job.userId !== userId) return null;
      jobs.delete(id);
      return job;
    },
  };
}

export const shouldUseBrowserDownload = (estimatedBytes, spoolLimitBytes) =>
  !estimatedBytes || estimatedBytes >= spoolLimitBytes;
