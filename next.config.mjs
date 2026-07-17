/** @type {import('next').NextConfig} */

const BOT_HOST = "bot.vidlink.app";

// Headers common to every response.
const baseHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Main site: locked down, must never be framed.
const siteCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.googlesyndication.com https://*.doubleclick.net",
  "frame-src https://*.googlesyndication.com https://*.doubleclick.net",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// Telegram Mini App: must load Telegram's SDK and BE framed by Telegram.
// No X-Frame-Options here — it can't express an allowlist; frame-ancestors does.
const tgCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://telegram.org",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "frame-ancestors https://web.telegram.org https://*.telegram.org tg://",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  // Emit a self-contained server bundle for small Docker images.
  output: "standalone",
  // Allow remote thumbnails from any host (video platforms)
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },

  // Serve the Mini App at the bot subdomain's root, keeping the WebApp URL clean.
  async rewrites() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: BOT_HOST }],
        destination: "/tg",
      },
    ];
  },

  async headers() {
    return [
      {
        // Bot subdomain (Mini App) — Telegram-compatible policy.
        source: "/(.*)",
        has: [{ type: "host", value: BOT_HOST }],
        headers: [...baseHeaders, { key: "Content-Security-Policy", value: tgCsp }],
      },
      {
        // Everything else — strict policy.
        source: "/(.*)",
        missing: [{ type: "host", value: BOT_HOST }],
        headers: [
          ...baseHeaders,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: siteCsp },
        ],
      },
    ];
  },
};

export default nextConfig;
