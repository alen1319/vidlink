"use client";
import Link from "next/link";
import { useApp } from "./AppProvider";

export default function CookieBanner() {
  const { t, consent, ready, chooseConsent } = useApp();
  if (!ready || consent !== "pending") return null;

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, padding: 16, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 760, width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow)", padding: "20px 22px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <p style={{ flex: 1, minWidth: 240, fontSize: "13.5px", lineHeight: 1.6, color: "var(--muted)" }}>
          {t.cookieText}{" "}
          <Link href="/privacy" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline" }}>{t.pPrivacy}</Link>
        </p>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={() => chooseConsent("necessary")} style={{ padding: "10px 16px", border: "1px solid var(--border)", background: "transparent", color: "var(--ink)", borderRadius: 10, fontFamily: "inherit", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>{t.cookieNecessary}</button>
          <button onClick={() => chooseConsent("all")} className="dc-hover" style={{ padding: "10px 20px", border: "none", background: "var(--grad)", color: "var(--btn-fg)", borderRadius: 10, fontFamily: "inherit", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>{t.cookieAccept}</button>
        </div>
      </div>
    </div>
  );
}
