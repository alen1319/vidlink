import Article from "@/app/components/Article";

export const metadata = {
  title: "Privacy Policy",
  description: "How Vidlink handles data, cookies, and Google AdSense advertising, plus your GDPR and CCPA rights.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <Article slug="privacy" />;
}
