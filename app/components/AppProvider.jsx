"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { STR } from "@/app/lib/i18n";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export default function AppProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("en");
  const [consent, setConsent] = useState("pending");
  const [ready, setReady] = useState(false);

  // Load persisted prefs on mount.
  useEffect(() => {
    try {
      const c = localStorage.getItem("vidlink-consent");
      if (c) setConsent(c);
      const t = localStorage.getItem("vidlink-theme");
      if (t === "light" || t === "dark") setTheme(t);
      const l = localStorage.getItem("vidlink-lang");
      if (l === "en" || l === "zh") setLang(l);
    } catch {}
    setReady(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem("vidlink-theme", next); } catch {}
      return next;
    });
  }, []);

  const changeLang = useCallback((l) => {
    setLang(l);
    try { localStorage.setItem("vidlink-lang", l); } catch {}
  }, []);

  const chooseConsent = useCallback((v) => {
    setConsent(v);
    try { localStorage.setItem("vidlink-consent", v); } catch {}
    // Hook point for Google Consent Mode v2 in production:
    // window.gtag?.('consent','update',{ ad_storage: v==='all'?'granted':'denied', ... })
  }, []);

  const t = STR[lang];

  return (
    <Ctx.Provider value={{ theme, lang, consent, ready, t, toggleTheme, changeLang, chooseConsent }}>
      <div id="app" data-theme={theme} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", transition: "background .3s, color .3s" }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}
