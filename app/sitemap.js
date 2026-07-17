const SITE = "https://vidlink.app";

export default function sitemap() {
  const now = new Date("2026-07-17");
  const routes = ["", "/privacy", "/terms", "/dmca", "/about", "/contact"];
  return routes.map((r) => ({
    url: `${SITE}${r}`,
    lastModified: now,
    changeFrequency: r === "" ? "daily" : "monthly",
    priority: r === "" ? 1 : 0.6,
  }));
}
