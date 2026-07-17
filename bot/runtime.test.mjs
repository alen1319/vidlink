import { describe, expect, it } from "vitest";
import { createConcurrencyGate, createJobStore, createRateLimiter, shouldUseBrowserDownload } from "./runtime.mjs";

describe("bot runtime guards", () => {
  it("caps concurrency and releases a slot only once", () => {
    const gate = createConcurrencyGate(1);
    const release = gate.acquire();
    expect(release).toBeTypeOf("function");
    expect(gate.acquire()).toBeNull();
    release();
    release();
    expect(gate.acquire()).toBeTypeOf("function");
  });

  it("rate limits all messages and bounds stored users", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, maxEntries: 2, now: () => now });
    expect(limiter.allow(1)).toBe(true);
    expect(limiter.allow(1)).toBe(true);
    expect(limiter.allow(1)).toBe(false);
    limiter.allow(2);
    limiter.allow(3);
    expect(limiter.size()).toBeLessThanOrEqual(2);
    now = 2000;
    expect(limiter.allow(1)).toBe(true);
  });

  it("consumes a job only for its owner", () => {
    const jobs = createJobStore({ maxEntries: 2, ttlMs: 1000, now: () => 0 });
    const id = jobs.put({ chatId: 10, userId: 20, url: "https://youtu.be/a" });
    expect(jobs.consume(id, 10, 99)).toBeNull();
    expect(jobs.consume(id, 10, 20)?.url).toBe("https://youtu.be/a");
    expect(jobs.consume(id, 10, 20)).toBeNull();
  });

  it("uses the browser when size is unknown or reaches the spool limit", () => {
    expect(shouldUseBrowserDownload(0, 49)).toBe(true);
    expect(shouldUseBrowserDownload(49, 49)).toBe(true);
    expect(shouldUseBrowserDownload(48, 49)).toBe(false);
  });
});
