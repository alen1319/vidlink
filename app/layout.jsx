import "./globals.css";

const SITE = "https://vidlink.app";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Vidlink — Free Online Video Downloader | Save Videos in HD, No Watermark",
    template: "%s | Vidlink",
  },
  description:
    "Vidlink is a free, clean online video downloader. Paste a link to save videos from YouTube, TikTok, Instagram, X, Facebook and Bilibili in 1080p HD or MP3 — no ads on your files, no sign-up, no watermark.",
  keywords: [
    "video downloader", "download video", "YouTube downloader", "TikTok downloader",
    "MP3 converter", "save video online", "HD video download",
  ],
  authors: [{ name: "Vidlink" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    title: "Vidlink — Free Online Video Downloader",
    description:
      "Paste a link, pick your quality, and download any video in seconds. Clean, private, no watermark.",
    siteName: "Vidlink",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vidlink — Free Online Video Downloader",
    description:
      "Paste a link, pick your quality, and download any video in seconds. Clean, private, no watermark.",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vidlink",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Free online video downloader for YouTube, TikTok, Instagram, X, Facebook and Bilibili.",
  url: SITE + "/",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {/* Google AdSense loader — active once NEXT_PUBLIC_ADSENSE_CLIENT is set. */}
        {ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
