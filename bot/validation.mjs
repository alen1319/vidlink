const HOST_PATH_RULES = new Map([
  ["youtube.com", /^\/(watch|shorts\/|live\/|embed\/)/],
  ["www.youtube.com", /^\/(watch|shorts\/|live\/|embed\/)/],
  ["m.youtube.com", /^\/(watch|shorts\/|live\/|embed\/)/],
  ["music.youtube.com", /^\/watch/],
  ["youtu.be", /^\/[^/]+/],
  ["tiktok.com", /^\/(?:@[^/]+\/video\/|t\/)/],
  ["www.tiktok.com", /^\/(?:@[^/]+\/video\/|t\/)/],
  ["m.tiktok.com", /^\/(?:@[^/]+\/video\/|t\/)/],
  ["vm.tiktok.com", /^\/[^/]+/],
  ["vt.tiktok.com", /^\/[^/]+/],
  ["instagram.com", /^\/(p|reel|reels|tv)\//],
  ["www.instagram.com", /^\/(p|reel|reels|tv)\//],
  ["twitter.com", /^\/[^/]+\/status\/\d+/],
  ["www.twitter.com", /^\/[^/]+\/status\/\d+/],
  ["x.com", /^\/[^/]+\/status\/\d+/],
  ["www.x.com", /^\/[^/]+\/status\/\d+/],
  ["facebook.com", /^\/(watch|reel\/|share\/|[^/]+\/videos\/)/],
  ["www.facebook.com", /^\/(watch|reel\/|share\/|[^/]+\/videos\/)/],
  ["m.facebook.com", /^\/(watch|reel\/|share\/|[^/]+\/videos\/)/],
  ["fb.watch", /^\/[^/]+/],
  ["bilibili.com", /^\/video\//],
  ["www.bilibili.com", /^\/video\//],
  ["m.bilibili.com", /^\/video\//],
  ["b23.tv", /^\/[^/]+/],
  ["vimeo.com", /^\/\d+/],
  ["www.vimeo.com", /^\/\d+/],
  ["player.vimeo.com", /^\/video\/\d+/],
  ["twitch.tv", /^\/(videos\/\d+|[^/]+\/?$)/],
  ["www.twitch.tv", /^\/(videos\/\d+|[^/]+\/?$)/],
  ["clips.twitch.tv", /^\/[^/]+/],
  ["soundcloud.com", /^\/[^/]+\/[^/]+/],
  ["www.soundcloud.com", /^\/[^/]+\/[^/]+/],
  ["on.soundcloud.com", /^\/[^/]+/],
  ["dailymotion.com", /^\/video\/[^/]+/],
  ["www.dailymotion.com", /^\/video\/[^/]+/],
  ["dai.ly", /^\/[^/]+/],
]);

const ALLOWED_SELECTORS = new Set(["mp3", "360", "480", "720", "1080"]);

export function isSupportedUrl(value) {
  try {
    if (typeof value !== "string" || value.length > 2048) return false;
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    const pathRule = HOST_PATH_RULES.get(hostname);
    if (!pathRule?.test(url.pathname)) return false;
    for (const queryValue of url.searchParams.values()) {
      if (/^(?:https?:)?\/\//i.test(queryValue.trim())) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function parseDownloadCallback(value) {
  const match = /^d:(\d{1,12}):(mp3|360|480|720|1080)$/.exec(value || "");
  if (!match || !ALLOWED_SELECTORS.has(match[2])) return null;
  return { id: match[1], selector: match[2] };
}
