import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.fn();
vi.mock("node:child_process", () => ({ spawn: spawnMock }));

const { fetchInfo, runYtDlp } = await import("./ytdlp");

function fakeChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();
  return child;
}

describe("yt-dlp process adapter", () => {
  beforeEach(() => spawnMock.mockReset());

  it("collects successful output", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const result = runYtDlp(["--version"]);
    child.stdout.emit("data", "2026.");
    child.stdout.emit("data", "01");
    child.emit("close", 0);
    await expect(result).resolves.toBe("2026.01");
  });

  it("returns parsed metadata from fetchInfo", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const result = fetchInfo("https://vimeo.com/76979871");
    child.stdout.emit("data", JSON.stringify({ id: "76979871", title: "Demo" }));
    child.emit("close", 0);
    await expect(result).resolves.toMatchObject({ title: "Demo" });
  });

  it("uses stderr for non-zero exits", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const result = runYtDlp(["bad"]);
    child.stderr.emit("data", "upstream failed");
    child.emit("close", 1);
    await expect(result).rejects.toThrow("upstream failed");
  });

  it("falls back to an exit-code error", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const result = runYtDlp(["bad"]);
    child.emit("close", 2);
    await expect(result).rejects.toThrow("yt-dlp exited with code 2");
  });

  it("propagates spawn errors", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const result = runYtDlp([]);
    child.emit("error", new Error("spawn failed"));
    await expect(result).rejects.toThrow("spawn failed");
  });

  it("kills a timed-out process", async () => {
    vi.useFakeTimers();
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const result = runYtDlp([], { timeoutMs: 5 });
    const assertion = expect(result).rejects.toThrow("yt-dlp timed out");
    await vi.advanceTimersByTimeAsync(5);
    await assertion;
    expect(child.kill).toHaveBeenCalledWith("SIGKILL");
    vi.useRealTimers();
  });

  it("kills the process when the request is aborted", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const controller = new AbortController();
    const result = runYtDlp([], { timeoutMs: 20, signal: controller.signal });
    controller.abort();
    await expect(result).rejects.toThrow("yt-dlp aborted");
    expect(child.kill).toHaveBeenCalledWith("SIGKILL");
  });
});
