import Article from "@/app/components/Article";

export const metadata = {
  title: "Contact",
  description: "Get in touch with Vidlink for support, legal and copyright matters, or advertising partnerships.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <Article slug="contact" />;
}
