import { describe, expect, it } from "vitest";
import { isSupportedUrl, parseDownloadCallback } from "./validation.mjs";

describe("Telegram bot URL validation", () => {
  it("accepts supported public video hosts", () => {
    expect(isSupportedUrl("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(isSupportedUrl("https://m.tiktok.com/@demo/video/123")).toBe(true);
  });

  it("rejects SSRF, credentials, ports, lookalikes, and oversized input", () => {
    expect(isSupportedUrl("http://127.0.0.1:3000/admin")).toBe(false);
    expect(isSupportedUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSupportedUrl("https://user:pass@youtube.com/watch?v=abc")).toBe(false);
    expect(isSupportedUrl("https://youtube.com:8443/watch?v=abc")).toBe(false);
    expect(isSupportedUrl("https://youtube.com.evil.example/watch?v=abc")).toBe(false);
    expect(isSupportedUrl(`https://youtube.com/${"x".repeat(2048)}`)).toBe(false);
  });

  it("rejects insecure and open-redirect URL shapes", () => {
    expect(isSupportedUrl("http://youtube.com/watch?v=abc")).toBe(false);
    expect(isSupportedUrl("https://l.facebook.com/l.php?u=http://169.254.169.254/latest")).toBe(false);
    expect(isSupportedUrl("https://www.youtube.com/redirect?q=http://127.0.0.1:3000")).toBe(false);
    expect(isSupportedUrl("https://www.youtube.com/watch?v=abc&next=https://evil.example")).toBe(false);
  });
});

describe("Telegram callback validation", () => {
  it("accepts only a numeric job id and supported quality", () => {
    expect(parseDownloadCallback("d:42:720")).toEqual({ id: "42", selector: "720" });
    expect(parseDownloadCallback("d:7:mp3")).toEqual({ id: "7", selector: "mp3" });
  });

  it("rejects malformed or unexpected callback data", () => {
    expect(parseDownloadCallback("d:42:9999")).toBeNull();
    expect(parseDownloadCallback("d:../../tmp:720")).toBeNull();
    expect(parseDownloadCallback("other:42:720")).toBeNull();
  });
});
