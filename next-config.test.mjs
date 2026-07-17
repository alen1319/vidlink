import { describe, expect, it } from "vitest";
import config from "./next.config.mjs";

describe("bot host routing", () => {
  it("rewrites the bot root before filesystem routes", async () => {
    const rewrites = await config.rewrites();
    expect(rewrites.beforeFiles).toEqual([
      expect.objectContaining({
        source: "/",
        destination: "/tg",
        has: [{ type: "host", value: "bot.vidlink.app" }],
      }),
    ]);
  });

  it("allows Telegram framing only on the bot host", async () => {
    const rules = await config.headers();
    const botHeaders = Object.fromEntries(rules[0].headers.map(({ key, value }) => [key, value]));
    const siteHeaders = Object.fromEntries(rules[1].headers.map(({ key, value }) => [key, value]));
    expect(botHeaders["X-Frame-Options"]).toBeUndefined();
    expect(botHeaders["Content-Security-Policy"]).toContain("frame-ancestors https://web.telegram.org");
    expect(siteHeaders["X-Frame-Options"]).toBe("DENY");
  });
});
