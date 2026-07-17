import Article from "@/app/components/Article";

export const metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Vidlink, the free online video downloader.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <Article slug="terms" />;
}
