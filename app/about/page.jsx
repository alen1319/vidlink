import Article from "@/app/components/Article";

export const metadata = {
  title: "About",
  description: "Vidlink is a free, clean, privacy-first online video downloader for the platforms you use every day.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <Article slug="about" />;
}
