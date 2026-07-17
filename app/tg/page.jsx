import Script from "next/script";
import TgApp from "@/app/components/TgApp";

export const metadata = {
  title: "Vidlink Mini App",
  description: "Download videos right inside Telegram.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TgApp />
    </>
  );
}
