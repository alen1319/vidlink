import { describe, expect, it } from "vitest";
import { clientIp, LIMITS } from "./limits";

const requestWith = (values) => ({ headers: new Headers(values) });

describe("limits", () => {
  it("has safe positive defaults", () => {
    expect(LIMITS.maxConcurrentDownloads).toBeGreaterThan(0);
    expect(LIMITS.maxQueue).toBeGreaterThan(0);
    expect(LIMITS.parse.max).toBeGreaterThan(0);
  });

  it("trusts only proxy-controlled single-IP headers", () => {
    expect(clientIp(requestWith({ "x-real-ip": "198.51.100.4", "cf-connecting-ip": "203.0.113.8", "x-forwarded-for": "10.0.0.1" }))).toBe("198.51.100.4");
    expect(clientIp(requestWith({ "x-forwarded-for": "10.0.0.1" }))).toBe("unknown");
  });
});
