"use client";
import { useEffect, useRef } from "react";
import { useApp } from "./AppProvider";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

/**
 * Ad slot. When NEXT_PUBLIC_ADSENSE_CLIENT and a `slot` id are configured,
 * it renders a real Google AdSense <ins> unit and requests an ad. Until then
 * it shows the labeled placeholder (so the layout/label is always present).
 *
 * @param {string} slot     data-ad-slot id for this unit
 * @param {string} size     human label, e.g. "728 × 90"
 * @param {number} marginTop
 */
export default function AdSlot({ slot = "", size = "728 × 90", marginTop = 48 }) {
  const { t, consent } = useApp();
  const enabled = Boolean(CLIENT && slot);
  const pushed = useRef(false);

  useEffect(() => {
    if (!enabled || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* adsbygoogle not ready yet */
    }
  }, [enabled, consent]);

  return (
    <div style={{ maxWidth: 760, margin: `${marginTop}px auto 0`, padding: "0 28px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--faint)", fontFamily: "'JetBrains Mono',monospace" }}>
          {t.adLabel}
        </span>
        {enabled ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", minHeight: 90 }}
            data-ad-client={CLIENT}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
            // Keep ads non-personalised until the user accepts all cookies.
            data-npa={consent === "all" ? "0" : "1"}
          />
        ) : (
          <div style={{ width: "100%", border: "1px dashed var(--border-h)", borderRadius: 14, padding: 22, textAlign: "center", background: "var(--surface3)", minHeight: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--faint)" }}>{size} · Google AdSense</span>
          </div>
        )}
      </div>
    </div>
  );
}
