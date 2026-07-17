const COPY = {
  zh: {
    home:
      "👋 欢迎使用 Vidlink！\n\n" +
      "把视频链接发给我，我就能帮你下载 —— 支持 YouTube、TikTok / 抖音、Instagram、X、Facebook 和 Bilibili。\n\n" +
      "无水印 · 免费 · 快速解析。",
    paste: "📋 请把视频链接粘贴到输入框并发送。\n\n我会自动解析视频，并让你选择清晰度或 MP3。",
    help:
      "ℹ️ 使用帮助\n\n" +
      "1. 复制公开视频链接\n" +
      "2. 回到这里粘贴并发送\n" +
      "3. 选择清晰度或 MP3\n" +
      "4. 小文件直接发送到聊天，大文件会转到浏览器下载\n\n" +
      "仅支持公开内容，请尊重版权和平台规则。",
    buttons: ["📋 粘贴链接", "ℹ️ 帮助", "📱 打开小程序", "🌐 English"],
  },
  en: {
    home:
      "👋 Welcome to Vidlink!\n\n" +
      "Send me a video link and I’ll help you download it — YouTube, TikTok, Instagram, X, Facebook, Bilibili and more.\n\n" +
      "No watermark · Free · Fast parsing.",
    paste: "📋 Paste a video link into the message box and send it.\n\nI’ll parse it and let you choose a quality or MP3.",
    help:
      "ℹ️ How to download\n\n" +
      "1. Copy a public video link\n" +
      "2. Paste and send it here\n" +
      "3. Pick a quality or MP3\n" +
      "4. Small files are sent in chat; large files open in your browser\n\n" +
      "Public content only. Please respect copyright and platform rules.",
    buttons: ["📋 Paste link", "ℹ️ Help", "📱 Open Mini App", "🌐 中文"],
  },
};

const normalizeLocale = (locale) => (locale === "en" ? "en" : "zh");

function keyboard(locale, miniappUrl) {
  const buttons = COPY[normalizeLocale(locale)].buttons;
  return {
    keyboard: [
      [{ text: buttons[0] }, { text: buttons[1] }],
      [{ text: buttons[2], web_app: { url: miniappUrl } }, { text: buttons[3] }],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: locale === "en" ? "Paste a video link…" : "粘贴视频链接…",
  };
}

function payload(locale, miniappUrl, key) {
  const normalized = normalizeLocale(locale);
  return {
    text: COPY[normalized][key],
    reply_markup: keyboard(normalized, miniappUrl),
    link_preview_options: { is_disabled: true },
  };
}

export const buildHomeMessage = (locale, miniappUrl) => payload(locale, miniappUrl, "home");
export const buildPasteMessage = (locale, miniappUrl) => payload(locale, miniappUrl, "paste");
export const buildHelpMessage = (locale, miniappUrl) => payload(locale, miniappUrl, "help");

export function resolveMenuAction(text) {
  const value = String(text || "").trim();
  if (/^\/start(?:@\w+)?(?:\s|$)/i.test(value)) return "home";
  if (/^\/help(?:@\w+)?(?:\s|$)/i.test(value) || ["ℹ️ 帮助", "ℹ️ Help"].includes(value)) return "help";
  if (/^\/app(?:@\w+)?(?:\s|$)/i.test(value) || ["📱 打开小程序", "📱 Open Mini App"].includes(value)) return "app";
  if (["📋 粘贴链接", "📋 Paste link"].includes(value)) return "paste";
  if (value === "🌐 English") return "english";
  if (value === "🌐 中文") return "chinese";
  return null;
}

export function createLocaleStore(maxEntries = 5000) {
  const locales = new Map();
  return {
    get(userId, fallback = "zh") {
      return locales.get(userId) || normalizeLocale(fallback);
    },
    set(userId, locale) {
      if (!locales.has(userId) && locales.size >= maxEntries) {
        locales.delete(locales.keys().next().value);
      }
      locales.set(userId, normalizeLocale(locale));
    },
    size: () => locales.size,
  };
}
