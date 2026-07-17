"use client";
import { useState } from "react";
import { useApp } from "./AppProvider";
import { PLATFORMS } from "@/app/lib/i18n";
import AdSlot from "./AdSlot";
import { triggerBrowserDownload } from "@/app/lib/browser-download";
import {
  IconYouTube, IconTikTok, IconInstagram, IconX, IconFacebook, IconBilibili,
  IconLink, IconDownload,
} from "./icons";

export default function Home() {
  const { t, lang } = useApp();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [batch, setBatch] = useState(false);
  const [history, setHistory] = useState([]);
  const [faqOpen, setFaqOpen] = useState(0);
  const [grabbing, setGrabbing] = useState(null); // quality currently downloading

  async function onParse() {
    const u = url.trim();
    if (!u || loading) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u, lang }),
      });
      if (!res.ok) {
        setError(t.parseError);
      } else {
        setResult(await res.json());
      }
    } catch {
      setError(t.parseError);
    } finally {
      setLoading(false);
    }
  }

  async function onPaste() {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) setUrl(txt);
    } catch {
      setUrl(PLATFORMS[0]);
    }
  }

  function grab(f) {
    if (!result) return;
    const params = new URLSearchParams({
      url: result.webpageUrl || url.trim(),
      quality: f.selector,
      title: result.title,
    });
    const downloadUrl = `/api/download?${params.toString()}`;
    const extension = f.kind === "audio" ? "mp3" : "mp4";
    triggerBrowserDownload(document, downloadUrl, `${result.title || "video"}.${extension}`);

    setGrabbing(f.quality);
    setTimeout(() => setGrabbing(null), 2500);

    const item = { title: result.title, quality: f.quality };
    setHistory((h) => [item, ...h.filter((x) => !(x.title === item.title && x.quality === item.quality))].slice(0, 4));
  }

  const inputBorder = url ? "var(--accent)" : "var(--border)";

  return (
    <>
      {/* HERO */}
      <header style={{ maxWidth: 900, margin: "0 auto", padding: "56px 28px 8px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border2)", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.72 0.15 150)" }} />
          {t.badge}
        </div>
        <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: "clamp(40px,6.4vw,68px)", lineHeight: 1.04, letterSpacing: "-0.02em" }}>
          {t.h1a}<br />
          <span style={{ fontStyle: "italic", background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{t.h1b}</span>
        </h1>
        <p style={{ maxWidth: 520, margin: "22px auto 0", fontSize: "16.5px", lineHeight: 1.6, color: "var(--muted)" }}>{t.sub}</p>
      </header>

      {/* DOWNLOADER CARD */}
      <section style={{ maxWidth: 760, margin: "38px auto 0", padding: "0 28px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, boxShadow: "var(--shadow)", overflow: "hidden" }}>
          <div style={{ padding: "26px 26px 22px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--surface2)", border: `1px solid ${inputBorder}`, borderRadius: 14, padding: "7px 7px 7px 18px", transition: "border-color .2s" }}>
              <IconLink />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onParse(); }}
                placeholder={t.placeholder}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: "14.5px", color: "var(--ink)", minWidth: 0 }}
              />
              <button onClick={onPaste} style={{ flexShrink: 0, padding: "9px 12px", border: "none", background: "transparent", color: "var(--faint)", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 9 }}>{t.paste}</button>
              <button onClick={onParse} style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, minWidth: 112, padding: "11px 20px", border: "none", borderRadius: 10, background: "var(--grad)", color: "var(--btn-fg)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer" }}>
                {loading ? <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(128,128,128,0.4)", borderTopColor: "var(--btn-fg)", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> : t.download}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 500 }}>{t.try}</span>
                <Chip onClick={() => setUrl(PLATFORMS[0])}><IconYouTube size={13} inner="var(--chip)" />YouTube</Chip>
                <Chip onClick={() => setUrl(PLATFORMS[1])}><IconTikTok size={12} />TikTok</Chip>
                <Chip onClick={() => setUrl(PLATFORMS[2])}><IconInstagram size={12} />Instagram</Chip>
                <Chip onClick={() => setUrl(PLATFORMS[3])}><IconX size={11} />X</Chip>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: "12.5px", color: "var(--muted)", fontWeight: 600 }}>
                <button onClick={() => setBatch((b) => !b)} style={{ width: 34, height: 20, borderRadius: 999, border: "none", cursor: "pointer", padding: 0, position: "relative", background: batch ? "var(--accent)" : "var(--chip-h)", transition: "background .2s" }}>
                  <span style={{ position: "absolute", top: 2, left: batch ? 16 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }} />
                </button>
                {t.batch}
              </label>
            </div>

            {error && (
              <p style={{ marginTop: 14, fontSize: 13, color: "#e5484d", fontWeight: 600 }}>{error}</p>
            )}
          </div>

          {/* RESULT */}
          {result && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "24px 26px", animation: "floatIn .4s ease both" }}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ position: "relative", width: 184, flexShrink: 0, borderRadius: 12, overflow: "hidden", background: "repeating-linear-gradient(135deg,var(--surface2),var(--surface2) 8px,var(--surface3) 8px,var(--surface3) 16px)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {result.thumbnail
                    ? <img src={result.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--faint)" }}>thumbnail</span>}
                  {result.duration && <span style={{ position: "absolute", bottom: 7, right: 7, background: "rgba(20,18,15,0.82)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 5, fontFamily: "'JetBrains Mono',monospace" }}>{result.duration}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{result.source}</span>
                  <h3 style={{ fontSize: "16.5px", fontWeight: 700, lineHeight: 1.35, marginBottom: 6 }}>{result.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--faint)" }}>{[result.author, result.views].filter(Boolean).join(" · ")}</p>
                </div>
              </div>

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {result.formats.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 12, background: i % 2 === 0 ? "var(--surface3)" : "var(--surface)" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, width: 60 }}>{f.quality}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--faint)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 5 }}>{f.ext}</span>
                    <span style={{ fontSize: "12.5px", color: "var(--muted)", flex: 1 }}>{f.note}</span>
                    <span style={{ fontSize: "12.5px", color: "var(--faint)", fontFamily: "'JetBrains Mono',monospace" }}>{f.size}</span>
                    <button onClick={() => grab(f)} className="dc-hover" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 15px", border: "none", borderRadius: 9, background: "var(--grad)", color: "var(--btn-fg)", fontSize: 13, fontWeight: 700, cursor: "pointer", minWidth: 74, justifyContent: "center" }}>
                      {grabbing === f.quality
                        ? <span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(0,0,0,0.35)", borderTopColor: "var(--btn-fg)", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                        : <><IconDownload />{t.get}</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HISTORY */}
        {history.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11, padding: "0 4px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.history}</span>
              <button onClick={() => setHistory([])} style={{ fontSize: 12, color: "var(--faint)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>{t.clear}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {history.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--surface3)", border: "1px solid var(--border2)", borderRadius: 11 }}>
                  <div style={{ width: 38, height: 26, borderRadius: 5, background: "repeating-linear-gradient(135deg,var(--surface2),var(--surface2) 5px,var(--surface3) 5px,var(--surface3) 10px)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.title}</span>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--faint)", fontFamily: "'JetBrains Mono',monospace" }}>{h.quality}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUPPORTED PLATFORMS */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>{t.worksWith}</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "12px 26px", color: "var(--muted)", opacity: 0.85 }}>
            <Plat><IconYouTube size={20} />YouTube</Plat>
            <Plat><IconTikTok size={17} />TikTok / 抖音</Plat>
            <Plat><IconInstagram size={18} />Instagram</Plat>
            <Plat><IconX size={16} />Twitter / X</Plat>
            <Plat><IconFacebook size={18} />Facebook</Plat>
            <Plat><IconBilibili size={19} />Bilibili</Plat>
          </div>
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP} size="728 × 90" marginTop={48} />

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1180, margin: "96px auto 0", padding: "0 28px", scrollMarginTop: 90 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>{t.featKicker}</p>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: "clamp(30px,4.4vw,44px)", letterSpacing: "-0.02em" }}>{t.featTitle}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 }}>
          {t.features.map((f, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 18, padding: 26, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontSize: 20 }}>{f.icon}</div>
              <h3 style={{ fontSize: "16.5px", fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EXTENSION */}
      <section id="extension" style={{ maxWidth: 1180, margin: "80px auto 0", padding: "0 28px", scrollMarginTop: 90 }}>
        <div className="ext-grid" style={{ background: "var(--ext-bg)", borderRadius: 26, padding: "clamp(36px,6vw,64px)", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center", overflow: "hidden" }}>
          <div>
            <p style={{ fontSize: "12.5px", fontWeight: 700, color: "oklch(0.76 0.09 72)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>{t.extKicker}</p>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: "clamp(28px,4vw,40px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#f7f5f0", marginBottom: 18 }}>{t.extTitle}</h2>
            <p style={{ fontSize: "15.5px", lineHeight: 1.65, color: "#a8a399", marginBottom: 28, maxWidth: 420 }}>{t.extDesc}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span aria-disabled="true" style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 22px", background: "#f4f3ef", color: "#171614", borderRadius: 12, fontSize: 14, fontWeight: 700, opacity: 0.75 }}>🧩 {t.extChrome}</span>
              <span aria-disabled="true" style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 22px", background: "transparent", color: "#f4f3ef", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, fontSize: 14, fontWeight: 700, opacity: 0.75 }}>🦊 {t.extFirefox}</span>
            </div>
          </div>
          <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: 16, background: "repeating-linear-gradient(135deg,#252220,#252220 10px,#2c2926 10px,#2c2926 20px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#5a564e" }}>extension preview</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 760, margin: "80px auto 0", padding: "0 28px", scrollMarginTop: 90 }}>
        <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: "clamp(28px,4vw,40px)", textAlign: "center", letterSpacing: "-0.02em", marginBottom: 36 }}>{t.faqTitle}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {t.faqs.map((q, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 14, overflow: "hidden" }}>
              <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "19px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: "15.5px", fontWeight: 700, color: "var(--ink)" }}>{q.q}</span>
                <span style={{ fontSize: 22, color: "var(--faint)", fontWeight: 300, flexShrink: 0, transform: faqOpen === i ? "rotate(45deg)" : "rotate(0deg)", transition: "transform .2s" }}>+</span>
              </button>
              {faqOpen === i && <p style={{ padding: "0 22px 20px", fontSize: "14.5px", lineHeight: 1.65, color: "var(--muted)" }}>{q.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM} size="336 × 280" marginTop={56} />
    </>
  );
}

function Chip({ onClick, children }) {
  return (
    <button onClick={onClick} className="link-hover" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--muted)", background: "var(--chip)", border: "1px solid var(--border2)", padding: "4px 10px 4px 8px", borderRadius: 999, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function Plat({ children }) {
  return <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14.5px", fontWeight: 700 }}>{children}</span>;
}
