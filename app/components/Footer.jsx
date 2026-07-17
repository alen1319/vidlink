"use client";
import Link from "next/link";
import { useApp } from "./AppProvider";

const footLink = { background: "none", border: "none", padding: 0, textAlign: "left", color: "var(--muted)", fontFamily: "inherit", fontSize: "14px", fontWeight: 500, cursor: "pointer", textDecoration: "none" };

export default function Footer() {
  const { t } = useApp();
  return (
    <footer style={{ maxWidth: 1180, margin: "96px auto 0", padding: "44px 28px 48px", borderTop: "1px solid var(--border)" }}>
      <div className="foot-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: "40px 28px" }}>
        <div style={{ maxWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src="/stut-mark.png" alt="Vidlink logo" width={20} height={20} style={{ objectFit: "contain" }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.03em" }}>Vidlink</span>
          </div>
          <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "var(--faint)" }}>{t.footTag}</p>
        </div>
        <div>
          <p style={colTitle}>{t.footProduct}</p>
          <div style={colWrap}>
            <Link href="/#features" style={footLink} className="link-hover">{t.navFeatures}</Link>
            <Link href="/#extension" style={footLink} className="link-hover">{t.navExt}</Link>
            <Link href="/#faq" style={footLink} className="link-hover">{t.navFaq}</Link>
          </div>
        </div>
        <div>
          <p style={colTitle}>{t.footLegal}</p>
          <div style={colWrap}>
            <Link href="/privacy" style={footLink} className="link-hover">{t.pPrivacy}</Link>
            <Link href="/terms" style={footLink} className="link-hover">{t.pTerms}</Link>
            <Link href="/dmca" style={footLink} className="link-hover">{t.pDmca}</Link>
          </div>
        </div>
        <div>
          <p style={colTitle}>{t.footCompany}</p>
          <div style={colWrap}>
            <Link href="/about" style={footLink} className="link-hover">{t.pAbout}</Link>
            <Link href="/contact" style={footLink} className="link-hover">{t.pContact}</Link>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <p style={{ fontSize: "12.5px", color: "var(--faint)" }}>{t.footer}</p>
        <p style={{ fontSize: "11.5px", color: "var(--faint)", maxWidth: 520, textAlign: "right" }}>{t.adDisclosure}</p>
      </div>
    </footer>
  );
}

const colTitle = { fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--faint)", marginBottom: 14 };
const colWrap = { display: "flex", flexDirection: "column", gap: 10, fontSize: "14px", alignItems: "flex-start" };
