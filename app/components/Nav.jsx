"use client";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { IconSun, IconMoon } from "./icons";

export default function Nav() {
  const { t, theme, lang, toggleTheme, changeLang } = useApp();
  const pill = (active) => ({
    border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: "999px",
    fontFamily: "inherit", fontWeight: 700, fontSize: "13px",
    background: active ? "var(--surface)" : "transparent",
    color: active ? "var(--ink)" : "var(--faint)",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
  });

  return (
    <nav style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", color: "var(--ink)" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <img src="/stut-mark.png" alt="Vidlink logo" width={26} height={26} style={{ objectFit: "contain" }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.03em" }}>Vidlink</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div className="nav-links" style={{ display: "flex", gap: 28, fontSize: "14.5px", fontWeight: 500, color: "var(--muted)" }}>
          <Link href="/#features" style={{ color: "inherit" }} className="link-hover">{t.navFeatures}</Link>
          <Link href="/#extension" style={{ color: "inherit" }} className="link-hover">{t.navExt}</Link>
          <Link href="/#faq" style={{ color: "inherit" }} className="link-hover">{t.navFaq}</Link>
        </div>
        <button onClick={toggleTheme} title="Theme" aria-label="Toggle theme" style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--track)", borderRadius: 999, padding: 3 }}>
          <button onClick={() => changeLang("en")} style={pill(lang === "en")}>EN</button>
          <button onClick={() => changeLang("zh")} style={pill(lang === "zh")}>中</button>
        </div>
      </div>
    </nav>
  );
}
