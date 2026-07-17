"use client";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { LEGAL } from "@/app/lib/legal";

/** Renders a legal/content page in the current language. `slug` selects the doc. */
export default function Article({ slug }) {
  const { t, lang } = useApp();
  const article = LEGAL[lang][slug] || LEGAL[lang].privacy;

  return (
    <article style={{ maxWidth: 760, margin: "36px auto 0", padding: "0 28px" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: "13.5px", fontWeight: 600, marginBottom: 24 }} className="link-hover">
        ← {t.back}
      </Link>
      <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: "clamp(32px,5vw,46px)", letterSpacing: "-0.02em", marginBottom: 12 }}>{article.title}</h1>
      <p style={{ fontSize: "12.5px", color: "var(--faint)", fontFamily: "'JetBrains Mono',monospace", marginBottom: 28 }}>{t.updated} {article.updated}</p>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--muted)", marginBottom: 36 }}>{article.intro}</p>
      {article.sections.map((sec, i) => (
        <section key={i} style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 12, color: "var(--ink)" }}>{sec.h}</h2>
          {sec.p.map((para, j) => (
            <p key={j} style={{ fontSize: 15, lineHeight: 1.75, color: "var(--muted)", marginBottom: 12 }}>{para}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
