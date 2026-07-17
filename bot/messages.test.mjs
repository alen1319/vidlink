import { describe, expect, it } from "vitest";
import { buildHelpMessage, buildHomeMessage, createLocaleStore, resolveMenuAction } from "./messages.mjs";

const MINIAPP_URL = "https://bot.vidlink.app";

describe("Telegram bot home experience", () => {
  it("builds the Chinese four-button keyboard with a real Mini App button", () => {
    const payload = buildHomeMessage("zh", MINIAPP_URL);
    expect(payload.text).toContain("欢迎使用 Vidlink");
    expect(payload.reply_markup.keyboard).toHaveLength(2);
    expect(payload.reply_markup.keyboard.flat().map((button) => button.text)).toEqual([
      "📋 粘贴链接", "ℹ️ 帮助", "📱 打开小程序", "🌐 English",
    ]);
    expect(payload.reply_markup.keyboard[1][0].web_app.url).toBe(MINIAPP_URL);
    expect(payload.reply_markup.resize_keyboard).toBe(true);
  });

  it("builds an English keyboard and help copy", () => {
    const home = buildHomeMessage("en", MINIAPP_URL);
    expect(home.text).toContain("Welcome to Vidlink");
    expect(home.reply_markup.keyboard[1][1].text).toBe("🌐 中文");
    expect(buildHelpMessage("en", MINIAPP_URL).text).toContain("How to download");
  });

  it("maps commands and localized keyboard labels to actions", () => {
    expect(resolveMenuAction("/start")).toBe("home");
    expect(resolveMenuAction("📋 粘贴链接")).toBe("paste");
    expect(resolveMenuAction("ℹ️ Help")).toBe("help");
    expect(resolveMenuAction("🌐 English")).toBe("english");
    expect(resolveMenuAction("🌐 中文")).toBe("chinese");
    expect(resolveMenuAction("https://youtu.be/abc")).toBeNull();
  });

  it("stores bounded per-user language preferences", () => {
    const locales = createLocaleStore(2);
    locales.set(1, "zh");
    locales.set(2, "en");
    locales.set(3, "zh");
    expect(locales.size()).toBe(2);
    expect(locales.get(1, "en")).toBe("en");
    expect(locales.get(2, "zh")).toBe("en");
  });
});
