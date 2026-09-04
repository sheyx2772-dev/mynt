"use client";

// Metadata cannot live in a client component, so the title and the crawler
// directive sit in katalog/layout.tsx beside this file.

// Copied from the Figma Make project. Only the four edits Next.js requires:
// the "use client" directive (this screen holds state), the import paths, the
// stylesheet import, and data-theme renamed to data-figma-theme so it cannot
// collide with the theme attribute the rest of the app already owns.

import React, { useState } from "react";
import ProfileCard from "@/components/figma/ProfileCard";
import { profiles } from "@/components/figma/profiles";
import { LAYOUTS } from "@/components/ui/LayoutSamples";
import "@/components/figma/katalog.css";

type Lang  = "uz" | "ru";
type Theme = "dark" | "light";

const CATS = [
  { id: "all",      uz: "Barchasi",          ru: "Все" },
  // Not a sector but a type: the fourteen cards that carry an organisation
  // rather than a person. A bank's own page still belongs under Banklar too,
  // so this cuts across the sector chips instead of replacing them.
  { id: "org",      uz: "Tashkilotlar",       ru: "Организации" },
  { id: "gov",      uz: "Davlat organlari",   ru: "Госорганы" },
  { id: "ministry", uz: "Vazirliklar",        ru: "Министерства" },
  { id: "bank",     uz: "Banklar",            ru: "Банки" },
  { id: "venture",  uz: "Venture / Fondlar",  ru: "Фонды" },
  { id: "startup",  uz: "Startaplar",          ru: "Стартапы" },
  { id: "corp",     uz: "Boshqa sohalar",     ru: "Другие сферы" },
  // Not profiles at all but the shapes a profile can take — the seven layouts
  // from the bench, shown here so a card can be pitched by form as well as by
  // who is on it.
  { id: "layouts",  uz: "Maketlar",           ru: "Макеты" },
];

/* ── SVG icons (monoline 16px, 1.5px stroke) ── */
function IconAll()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconGov()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2L22 8.5V9H2V8.5L12 2z"/><rect x="3" y="9" width="18" height="11" rx="0"/><line x1="3" y1="20" x2="21" y2="20"/><rect x="7" y="13" width="3" height="7"/><rect x="14" y="13" width="3" height="7"/></svg>; }
function IconMin()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 3v1m0 16v1M5.6 5.6l.7.7m11.4-.7-.7.7M3 12h1m16 0h1"/><circle cx="12" cy="12" r="4"/></svg>; }
function IconBank()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>; }
function IconVC()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></svg>; }
function IconStartup()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>; }
function IconCorp()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>; }
function IconLayouts()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="8" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/></svg>; }
function IconOrg()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V6l7-3 7 3v15"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/></svg>; }
function IconMoon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function IconSun()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>; }
function IconNFC()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 12a8 8 0 01-8 8"/><path d="M12 4a8 8 0 018 8"/><path d="M16 12a4 4 0 01-4 4"/><path d="M12 8a4 4 0 014 4"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>; }

const CAT_ICON: Record<string, () => React.ReactElement> = {
  all: IconAll, gov: IconGov, ministry: IconMin,
  bank: IconBank, venture: IconVC, startup: IconStartup, corp: IconCorp,
  org: IconOrg, layouts: IconLayouts,
};

export default function KatalogPage() {
  const [lang,  setLang]  = useState<Lang>("uz");
  const [theme, setTheme] = useState<Theme>("dark");
  const [cat,   setCat]   = useState("all");

  const filtered =
    cat === "all" ? profiles
    : cat === "org" ? profiles.filter(p => !p.avatar)
    : profiles.filter(p => p.category === cat);
  const total    = profiles.length;
  const sohalar  = new Set(profiles.map(p => p.category)).size;

  return (
    <div className="figma-katalog" data-figma-theme={theme} style={{ minHeight: "100vh", background: "var(--bg-app)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>

      {/* ══ HEADER ═══════════════════════════════════════════ */}
      <header style={{
        background: "var(--header-bg)",
        color: "var(--header-text)",
        paddingTop: `calc(var(--safe-top) + 16px)`,
        paddingBottom: 14,
        paddingLeft: 16,
        paddingRight: 16,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#c8973a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
              <IconNFC />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, lineHeight: "18px", letterSpacing: "-0.3px" }}>
                flex<span style={{ color: "#c8973a" }}>.com.uz</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                NFC Vizitka Platformasi
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* UZ/RU switcher */}
            <div style={{ display: "flex", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.18)", overflow: "hidden" }}>
              {(["uz", "ru"] as Lang[]).map(l => (
                <button
                  key={l}
                  className="chip-btn"
                  onClick={() => setLang(l)}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "var(--font-sans)",
                    border: "none",
                    cursor: "pointer",
                    background: lang === l ? "#c8973a" : "transparent",
                    color: lang === l ? "#fff" : "rgba(255,255,255,0.55)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              className="btn-primary"
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
              aria-label="Tema almashtirish"
            >
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </div>
      </header>

      {/* ══ FILTER ROW + STATS ══════════════════════════════ */}
      <div style={{ padding: "14px 0 8px", borderBottom: "1px solid var(--border)" }}>

        {/* Stats inline with label — 14px, single line */}
        <div style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            {lang === "uz" ? "Profillar" : "Профили"}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {total} {lang === "uz" ? "profil" : "профилей"} · {sohalar} {lang === "uz" ? "soha" : "сфер"}
          </span>
          {/* NFC live dot */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
            <div className="nfc-badge" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>NFC</span>
          </div>
        </div>

        {/* Horizontal scroll chips — 44pt tall, 8pt gap, 16pt edge padding */}
        <div className="scrollbar-hide" style={{ overflowX: "auto", display: "flex", gap: 8, paddingLeft: 16, paddingRight: 32, paddingBottom: 4, height: 44, alignItems: "center" }}>
          {CATS.map(c => {
            const CIcon = CAT_ICON[c.id];
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                className="chip-btn"
                onClick={() => setCat(c.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 14px",
                  height: 34,
                  borderRadius: "var(--r-chip)",
                  border: `1.5px solid ${active ? "transparent" : "var(--chip-border)"}`,
                  background: active ? "var(--chip-active-bg)" : "var(--chip-bg)",
                  color: active ? "var(--chip-active-text)" : "var(--text-secondary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  cursor: "pointer",
                  boxShadow: active ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <CIcon />
                {lang === "uz" ? c.uz : c.ru}
              </button>
            );
          })}
        </div>
      </div>

      {cat === "layouts" ? (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 28, padding: "24px 16px 40px", maxWidth: 1280, margin: "0 auto",
          // the catalogue redefines --font-sans as Nunito; these layouts are
          // drawn in the app's own face and must not inherit that
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        }}>
          {LAYOUTS.map((l) => (
            <section key={l.name}>
              <header style={{ marginBottom: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{l.name}</h3>
                <p style={{ fontSize: 12, lineHeight: "17px", color: "var(--text-muted)", margin: "3px 0 0" }}>{l.note}</p>
                <p style={{ fontSize: 12, lineHeight: "17px", color: "var(--text-muted)", margin: "2px 0 0" }}>{l.who}</p>
              </header>
              <div style={{ borderRadius: "var(--r-2xl)", overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
                {l.render()}
              </div>
            </section>
          ))}
        </div>
      ) : (
      <>
      {/* ══ CARD GRID ════════════════════════════════════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 24,
        padding: "24px 16px 40px",
        maxWidth: 1280,
        margin: "0 auto",
      }}>
        {filtered.map(profile => (
          <div
            key={profile.id}
            className="card-fade"
            style={{
              position: "relative",
              borderRadius: "var(--r-2xl)",
              overflow: "hidden",
              boxShadow: "var(--card-shadow)",
              maxHeight: 620,
              overflowY: "auto",
            }}
            // remove card-fade overflow so scroll works
          >
            <div className="scrollbar-hide" style={{ overflowY: "auto", maxHeight: 620, borderRadius: "var(--r-2xl)" }}>
              <ProfileCard profile={profile} lang={lang} theme={theme} />
            </div>
            {/* Bottom fade overlay */}
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0, height: 60, pointerEvents: "none",
              background: "linear-gradient(to bottom, transparent, var(--bg-app))",
              borderRadius: "0 0 var(--r-2xl) var(--r-2xl)",
            }} />
          </div>
        ))}
      </div>

      </>
      )}

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer style={{ background: "var(--header-bg)", padding: "16px 16px calc(96px + var(--safe-bottom))", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            O&apos;zbekiston Respublikasi · flex.com.uz
          </span>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            NFC Digital · 2024
          </span>
        </div>
      </footer>
    </div>
  );
}
