import { describe, expect, it, vi } from "vitest";
import { triggerBrowserDownload } from "./browser-download";

describe("triggerBrowserDownload", () => {
  it("uses a direct download link so mobile Safari receives a user gesture", () => {
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = { click, remove, style: {} };
    const appendChild = vi.fn();
    const documentRef = {
      createElement: vi.fn(() => anchor),
      body: { appendChild },
    };

    triggerBrowserDownload(documentRef, "/api/download?quality=720", "clip.mp4");

    expect(documentRef.createElement).toHaveBeenCalledWith("a");
    expect(anchor.href).toBe("/api/download?quality=720");
    expect(anchor.download).toBe("clip.mp4");
    expect(anchor.target).toBe("_blank");
    expect(anchor.rel).toBe("noopener");
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });

  it("rejects links outside the download endpoint", () => {
    const documentRef = { createElement: vi.fn(), body: { appendChild: vi.fn() } };

    expect(() => triggerBrowserDownload(documentRef, "https://example.com/file", "clip.mp4"))
      .toThrow("invalid download URL");
    expect(documentRef.createElement).not.toHaveBeenCalled();
  });
});
