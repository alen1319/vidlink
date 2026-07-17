import AppProvider from "@/app/components/AppProvider";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import CookieBanner from "@/app/components/CookieBanner";

/**
 * Chrome for the public marketing/site routes. The Telegram Mini App at /tg
 * sits outside this group so it renders bare inside the Telegram client.
 */
export default function SiteLayout({ children }) {
  return (
    <AppProvider>
      <Nav />
      {children}
      <Footer />
      <CookieBanner />
    </AppProvider>
  );
}
