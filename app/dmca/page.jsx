import Article from "@/app/components/Article";

export const metadata = {
  title: "DMCA / Copyright Policy",
  description: "Vidlink's copyright policy and how to file a DMCA takedown notice or counter-notice.",
  alternates: { canonical: "/dmca" },
};

export default function Page() {
  return <Article slug="dmca" />;
}
