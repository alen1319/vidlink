"use client";
import { useEffect, useState } from "react";
import { IconLink, IconClipboard, IconDownload } from "./icons";

/**
 * Telegram Mini App UI (served at bot.vidlink.app).
 * Adopts Telegram's theme params so it blends into the client, and hands
 * downloads to the system browser via WebApp.openLink().
 */
export default function TgApp() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [lang, setLang] = useState("zh");

  useEffect(() => {
    const wa = window.Telegram?.WebApp;
    if (!wa) return;
    wa.ready();
    wa.expand();
    // Follow the user's Telegram language when we know it.
    const code = wa.initDataUnsafe?.user?.language_code || "";
    setLang(code.startsWith("zh") ? "zh" : "en");
  }, []);

  const t = lang === "zh"
    ? { title: "粘贴链接，一键下载", ph: "粘贴视频链接…", btn: "粘贴并下载", err: "无法解析该链接，请检查后重试。", pick: "选择清晰度", by: "作者" }
    : { title: "Paste a link, download it", ph: "Paste a video URL…", btn: "Paste & Download", err: "Couldn't parse that link. Try again.", pick: "Pick a quality", by: "by" };

  async function go() {
    if (loading) return;
    let u = url.trim();
    if (!u) {
      try {
        const txt = (await navigator.clipboard.readText()).trim();
        if (txt) { u = txt; setUrl(txt); }
      } catch {}
      if (!u) { setError(t.err); return; }
    }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u, lang }),
      });
      if (!res.ok) setError(t.err);
      else setResult(await res.json());
    } catch { setError(t.err); }
    finally { setLoading(false); }
  }

  function grab(f) {
    const params = new URLSearchParams({
      url: result.webpageUrl || url.trim(),
      quality: f.selector,
      title: result.title,
    });
    const link = `${window.location.origin}/api/download?${params}`;
    const wa = window.Telegram?.WebApp;
    // Open outside the webview so the browser handles the file download.
    if (wa?.openLink) wa.openLink(link, { try_instant_view: false });
    else window.open(link, "_blank");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--tg-theme-bg-color, #0a0a0c)", color: "var(--tg-theme-text-color, #f3f3f7)", fontFamily: "'Manrope','Noto Sans SC',sans-serif", padding: "18px 16px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <img src="/stut-mark.png" alt="" width={22} height={22} style={{ objectFit: "contain" }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>Vidlink</span>
      </div>

      <p style={{ fontSize: 15, color: "var(--tg-theme-hint-color, #9a9aa7)", marginBottom: 14 }}>{t.title}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--tg-theme-secondary-bg-color, #1b1b22)", border: "1px solid rgba(128,128,128,0.25)", borderRadius: 12, padding: "6px 6px 6px 14px", marginBottom: 10 }}>
        <IconLink size={16} />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") go(); }}
          placeholder={t.ph}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 13.5, color: "inherit", minWidth: 0 }}
        />
      </div>

      <button onClick={go} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", border: "none", borderRadius: 11, background: "linear-gradient(120deg,#3ef2a1 0%,#22d3ee 34%,#6d7cff 66%,#b06bff 100%)", color: "#0a0a0c", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        {loading
          ? <span style={{ display: "inline-block", width: 15, height: 15, border: "2px solid rgba(0,0,0,0.35)", borderTopColor: "#0a0a0c", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          : <><IconClipboard />{t.btn}</>}
      </button>

      {error && <p style={{ marginTop: 12, fontSize: 13, color: "#e5484d", fontWeight: 600 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20, animation: "floatIn .4s ease both" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {result.thumbnail && (
              <img src={result.thumbnail} alt="" style={{ width: 108, borderRadius: 9, aspectRatio: "16/9", objectFit: "cover", flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35, marginBottom: 4 }}>{result.title}</p>
              <p style={{ fontSize: 12, color: "var(--tg-theme-hint-color, #9a9aa7)" }}>
                {[result.author, result.duration].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--tg-theme-hint-color, #9a9aa7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 9 }}>{t.pick}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {result.formats.map((f, i) => (
              <button key={i} onClick={() => grab(f)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", border: "1px solid rgba(128,128,128,0.25)", borderRadius: 10, background: "var(--tg-theme-secondary-bg-color, #161619)", color: "inherit", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, width: 48 }}>{f.quality}</span>
                <span style={{ fontSize: 12, color: "var(--tg-theme-hint-color, #9a9aa7)", flex: 1 }}>{f.note}</span>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "var(--tg-theme-hint-color, #9a9aa7)" }}>{f.size}</span>
                <IconDownload size={15} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
