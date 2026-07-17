import { describe, expect, it } from "vitest";
import { acquireSlot, stats } from "./queue";
import { LIMITS } from "./limits";

describe("download queue", () => {
  it("makes each release callback idempotent", async () => {
    const releaseFirst = await acquireSlot();
    const releaseSecond = await acquireSlot();

    releaseFirst();
    releaseFirst();

    expect(stats().active).toBe(1);
    releaseSecond();
    expect(stats().active).toBe(0);
  });

  it("hands a released slot to a queued job", async () => {
    const releases = await Promise.all(Array.from({ length: LIMITS.maxConcurrentDownloads }, () => acquireSlot()));
    const queued = acquireSlot();
    expect(stats()).toEqual({ active: LIMITS.maxConcurrentDownloads, waiting: 1 });
    releases[0]();
    const queuedRelease = await queued;
    expect(stats()).toEqual({ active: LIMITS.maxConcurrentDownloads, waiting: 0 });
    for (const release of releases.slice(1)) release();
    queuedRelease();
    expect(stats()).toEqual({ active: 0, waiting: 0 });
  });

  it("rejects work after the bounded queue is full", async () => {
    const activeReleases = await Promise.all(Array.from({ length: LIMITS.maxConcurrentDownloads }, () => acquireSlot()));
    const queued = Array.from({ length: LIMITS.maxQueue }, () => acquireSlot());
    await expect(acquireSlot()).rejects.toMatchObject({ code: "busy" });
    for (const release of activeReleases) release();
    await Promise.all(queued.map(async (job) => (await job)()));
    expect(stats()).toEqual({ active: 0, waiting: 0 });
  });

  it("removes an aborted waiter", async () => {
    const activeReleases = await Promise.all(Array.from({ length: LIMITS.maxConcurrentDownloads }, () => acquireSlot()));
    const controller = new AbortController();
    const queued = acquireSlot({ signal: controller.signal });
    controller.abort();
    await expect(queued).rejects.toMatchObject({ code: "aborted" });
    expect(stats().waiting).toBe(0);
    for (const release of activeReleases) release();
  });

  it("rejects an already-aborted request without occupying a slot", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(acquireSlot({ signal: controller.signal })).rejects.toMatchObject({ code: "aborted" });
    expect(stats()).toEqual({ active: 0, waiting: 0 });
  });

  it("times out a waiter", async () => {
    const activeReleases = await Promise.all(Array.from({ length: LIMITS.maxConcurrentDownloads }, () => acquireSlot()));
    await expect(acquireSlot({ timeoutMs: 1 })).rejects.toMatchObject({ code: "busy" });
    expect(stats().waiting).toBe(0);
    for (const release of activeReleases) release();
  });
});
