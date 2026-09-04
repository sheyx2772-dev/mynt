import React from "react";
import type { Profile } from "./profiles";

// ── Brand banner images ──────────────────────────────────────────────────────
const imgMarkaziyBank = "/figma-make/image-10.png";
const imgYoshlarVentures = "/figma-make/image-12.png";
const imgITPark = "/figma-make/image-14.png";
const imgStartupGarage = "/figma-make/image-15.png";
const imgUnitedVentures = "/figma-make/image-16.png";
const imgICTWeek = "/figma-make/image-17.png";
const imgATKRV = "/figma-make/image-18.png";
const imgProkuratura = "/figma-make/image-19.png";

const BANNER: Record<string, string> = {
  "tashkent-inn": imgStartupGarage,
  "hokimiyat":    imgProkuratura,
  "moliya":       imgMarkaziyBank,
  "iqtisodiyot":  imgATKRV,
  "raqamli":      imgATKRV,
  "nbu":          imgMarkaziyBank,
  "agrobank":     imgMarkaziyBank,
  "kapitalbank":  imgProkuratura,
  "uzv-fund":     imgYoshlarVentures,
  "uzfar":        imgUnitedVentures,
  "itpark":       imgITPark,
  "chamber":      imgStartupGarage,
  "uzreport":     imgICTWeek,
};

// ── Per-profile color config ─────────────────────────────────────────────────
interface Cfg { overlay: string; cardBg: string; bodyBg: string; accent: string; accent2: string; iconBg: string }
const CFG: Record<string, Cfg> = {
  "tashkent-inn": { overlay:"linear-gradient(180deg,rgba(28,12,80,.5) 0%,rgba(45,18,120,.88) 100%)", cardBg:"#1c0c50", bodyBg:"#0e0630", accent:"#c4b5fd", accent2:"#8b5cf6", iconBg:"#2a1268" },
  "hokimiyat":    { overlay:"linear-gradient(180deg,rgba(10,30,80,.52) 0%,rgba(15,45,110,.88) 100%)", cardBg:"#0f2d6e", bodyBg:"#071640", accent:"#f0b429", accent2:"#c78e1a", iconBg:"#163580" },
  "moliya":       { overlay:"linear-gradient(180deg,rgba(0,40,15,.48) 0%,rgba(0,60,20,.88) 100%)",  cardBg:"#00280f", bodyBg:"#001208", accent:"#4cbb77", accent2:"#2d9955", iconBg:"#003d18" },
  "iqtisodiyot":  { overlay:"linear-gradient(180deg,rgba(20,28,100,.52) 0%,rgba(30,40,140,.88) 100%)",cardBg:"#141c64", bodyBg:"#0a1040", accent:"#818cf8", accent2:"#6366f1", iconBg:"#1e2880" },
  "raqamli":      { overlay:"linear-gradient(180deg,rgba(15,22,70,.52) 0%,rgba(20,35,100,.88) 100%)", cardBg:"#0f1646", bodyBg:"#080d2a", accent:"#38bdf8", accent2:"#0ea5e9", iconBg:"#162060" },
  "nbu":          { overlay:"linear-gradient(180deg,rgba(0,50,15,.45) 0%,rgba(0,70,25,.88) 100%)",   cardBg:"#002a0f", bodyBg:"#001408", accent:"#d4a84b", accent2:"#b08a30", iconBg:"#003d18" },
  "agrobank":     { overlay:"linear-gradient(180deg,rgba(10,60,20,.48) 0%,rgba(15,80,30,.88) 100%)", cardBg:"#0a3c14", bodyBg:"#051e0a", accent:"#6ee7b7", accent2:"#34d399", iconBg:"#0e4e1c" },
  "kapitalbank":  { overlay:"linear-gradient(180deg,rgba(90,0,0,.52) 0%,rgba(140,5,5,.88) 100%)",    cardBg:"#5a0000", bodyBg:"#2e0000", accent:"#fca5a5", accent2:"#ef4444", iconBg:"#780a0a" },
  "uzv-fund":     { overlay:"linear-gradient(180deg,rgba(30,14,0,.4) 0%,rgba(60,25,0,.82) 100%)",    cardBg:"#1e0e00", bodyBg:"#0f0700", accent:"#fb923c", accent2:"#ea580c", iconBg:"#2e1600" },
  "uzfar":        { overlay:"linear-gradient(180deg,rgba(5,38,20,.45) 0%,rgba(8,55,30,.84) 100%)",   cardBg:"#052614", bodyBg:"#021209", accent:"#6ee7b7", accent2:"#10b981", iconBg:"#073520" },
  "itpark":       { overlay:"linear-gradient(180deg,rgba(14,48,6,.45) 0%,rgba(22,68,8,.82) 100%)",   cardBg:"#0e3006", bodyBg:"#071803", accent:"#a3e635", accent2:"#84cc16", iconBg:"#174008" },
  "chamber":      { overlay:"linear-gradient(180deg,rgba(28,12,80,.45) 0%,rgba(45,18,120,.84) 100%)",cardBg:"#1c0c50", bodyBg:"#0e0630", accent:"#c4b5fd", accent2:"#8b5cf6", iconBg:"#2a1268" },
  "uzreport":     { overlay:"linear-gradient(180deg,rgba(5,18,60,.48) 0%,rgba(8,28,90,.88) 100%)",   cardBg:"#05123c", bodyBg:"#020a22", accent:"#38bdf8", accent2:"#0284c7", iconBg:"#0a1e5a" },
};
const getCfg = (p: Profile): Cfg =>
  CFG[p.id] ?? { overlay:"linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,.85) 100%)", cardBg:p.coverColor, bodyBg:"#000", accent:p.coverAccent, accent2:p.coverAccent, iconBg:"#ffffff18" };

// ── Bilingual labels ─────────────────────────────────────────────────────────
const L = {
  uz: {
    email: "E-pochta", call: "Qo'ng'iroq", cal: "Uchrashuv", connect: "Havola",
    li: "LinkedIn", ig: "Instagram", yt: "YouTube", tg: "Telegram",
    add: "KONTAKTGA QO'SHISH", share: "ULASHISH", website: "Veb-sayt",
    about: "Tashkilot haqida", verified: "Tasdiqlangan",
    phone: "Telefon", mail: "Elektron pochta", addr: "Manzil",
  },
  ru: {
    email: "E-mail", call: "Звонок", cal: "Встреча", connect: "Ссылка",
    li: "LinkedIn", ig: "Instagram", yt: "YouTube", tg: "Telegram",
    add: "В КОНТАКТЫ", share: "ПОДЕЛИТЬСЯ", website: "Сайт",
    about: "Об организации", verified: "Подтверждён",
    phone: "Телефон", mail: "Электронная почта", addr: "Адрес",
  },
};

// ── Icon components ──────────────────────────────────────────────────────────
const I = {
  email:   <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>,
  call:    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.99 1.13 2 2 0 013 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  cal:     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
  connect: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  li:      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
  ig:      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" stroke="none"/></svg>,
  yt:      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>,
  tg:      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.05 1.577c-.393-.016-.784.08-1.117.235L2.242 9.842c-.952.38-1.769 1.048-1.769 1.999 0 1.134 1.07 1.585 1.923 1.837l3.986 1.31c.424 1.461 1.368 5.157 1.62 6.246.088.363.25.74.565.946.316.207.766.248 1.07.045.302-.201.536-.496.718-.804l2.034-3.296 3.927 3.15c.568.456 1.21.7 1.857.7.36 0 .72-.078 1.06-.238.69-.32 1.073-.987 1.247-1.733l2.7-13.005c.205-.951.157-1.93-.384-2.668a2.59 2.59 0 00-1.74-1.03z"/></svg>,
  pin:     <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  plus:    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  share:   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  web:     <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  check:   <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

// ── Icon button ──────────────────────────────────────────────────────────────
function IBtn({ icon, label, bg, color = "white" }: { icon: React.ReactElement; label: string; bg: string; color?: string }) {
  return (
    <div className="icon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: "var(--icon-size)", height: "var(--icon-size)",
        borderRadius: "var(--r-icon)",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: bg, color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.52)", fontWeight: 600, textAlign: "center", lineHeight: "11px", maxWidth: 52 }}>
        {label}
      </span>
    </div>
  );
}

// ── Main card ────────────────────────────────────────────────────────────────
interface Props { profile: Profile; lang: "uz" | "ru"; theme: "dark" | "light" }

export default function ProfileCard({ profile, lang, theme }: Props) {
  const c    = getCfg(profile);
  const t    = L[lang];
  const pos  = lang === "uz" ? profile.position : profile.positionRu;
  const banner = BANNER[profile.id];

  return (
    <div style={{ display: "flex", flexDirection: "column", background: c.cardBg, fontFamily: "var(--font-sans)" }}>

      {/* ══ BANNER — brand image full-bleed ══════════════════ */}
      {/* overflow was "hidden" here, which clipped the avatar's lower half — it is
          positioned at bottom:-38 precisely so it laps over the edge. The image,
          overlay and fade below are all inset:0 with objectFit cover, so none of
          them needs clipping; the card wrapper already rounds the top corners. */}
      <div style={{ position: "relative", height: 180, overflow: "visible", flexShrink: 0 }}>
        {/* Full-bleed brand image */}
        {banner && (
          <img
            src={banner}
            alt={profile.orgShort}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center",
              WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 42%, rgba(0,0,0,0) 88%)", maskImage: "linear-gradient(to bottom, #000 0%, #000 42%, rgba(0,0,0,0) 88%)" }}
          />
        )}
        {/* Smooth gradient overlay — NO harsh seam, fades into cardBg */}
        <div style={{ position: "absolute", inset: 0, background: c.overlay,
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 42%, rgba(0,0,0,0) 88%)", maskImage: "linear-gradient(to bottom, #000 0%, #000 42%, rgba(0,0,0,0) 88%)" }} />
        {/* Bottom edge fade into card body (eliminates hard seam) */}
        {/* The banner used to end with a fade layer painted over it, sized to
            reach the card colour exactly at the banner's last row. That row sits
            on a fractional pixel, so the browser painted it half-covered and let
            the bright artwork leak through as a hairline — visible on every card,
            and unmoved by any change to the fade's height or easing. Masking the
            artwork and its tint instead means nothing bright reaches the boundary
            at all, and the seam is gone. Verified on the rendered page. */}

        {/* Category chip — top left, 16pt from edge */}
        <div style={{ position: "absolute", top: 12, left: 16, zIndex: 2 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
            padding: "3px 10px", borderRadius: 100, background: c.accent, color: c.cardBg,
          }}>
            {profile.categoryLabel}
          </span>
        </div>

        {/* Location pill — top right, 16pt from edge */}
        <div style={{ position: "absolute", top: 12, right: 16, zIndex: 2, display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 100, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
          <span style={{ color: "white" }}>{I.pin}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Toshkent</span>
        </div>

        {/* Avatar — bottom center, overlapping */}
        <div style={{ position: "absolute", bottom: -38, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", overflow: "hidden",
              border: `3px solid ${c.accent}`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.45), 0 0 0 3px ${c.cardBg}`,
            }}>
              <img src={profile.avatar} alt={profile.fullName} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
            {profile.verified && (
              <div style={{
                position: "absolute", bottom: 0, right: -2,
                width: 22, height: 22, borderRadius: "50%",
                background: c.accent, border: `2.5px solid ${c.cardBg}`,
                display: "flex", alignItems: "center", justifyContent: "center", color: c.cardBg,
              }}>
                {I.check}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ IDENTITY ═════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "50px 20px 16px" }}>
        {/* Name — 24px / 600 weight / serif for name only */}
        <h2 style={{ fontSize: 22, fontWeight: 700, lineHeight: "28px", color: "#ffffff", fontFamily: "var(--font-serif)", margin: 0, letterSpacing: "-0.3px" }}>
          {profile.fullName}
        </h2>
        {/* Org — 13px / 600 / accent color (lighter than name — corrected hierarchy) */}
        <p style={{ fontSize: 11, fontWeight: 600, color: c.accent, margin: "5px 0 0", letterSpacing: "0.02em" }}>
          {profile.organization}
        </p>
        {/* Position — 12px / 400 / minimum 4.5:1 contrast (rgba white at 80%) */}
        <p style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.82)", margin: "4px 0 0", lineHeight: "17px", maxWidth: 280,
          /* line-clamp: 2 */ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {pos}
        </p>
        {/* Verified only — NO gender/age badge */}
        {profile.verified && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, padding: "3px 10px", borderRadius: 100, background: c.accent + "22", border: `1px solid ${c.accent}50` }}>
            <span style={{ color: c.accent, display: "flex" }}>{I.check}</span>
            <span style={{ fontSize: 9, color: c.accent, fontWeight: 700, letterSpacing: "0.05em" }}>{t.verified}</span>
          </div>
        )}
      </div>

      {/* ══ 8-ICON GRID — all brand-specific colors ══════════ */}
      <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: "var(--icon-gap)" }}>
        {/* Row 1: primary actions — monochrome accent */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--icon-gap)" }}>
          <IBtn icon={I.email}   label={t.email}   bg={c.iconBg} />
          <IBtn icon={I.call}    label={t.call}     bg={c.iconBg} />
          <IBtn icon={I.cal}     label={t.cal}      bg={c.iconBg} />
          <IBtn icon={I.connect} label={t.connect}  bg={c.iconBg} />
        </div>
        {/* Row 2: social apps — brand colors (consistent with app icons) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--icon-gap)" }}>
          <IBtn icon={I.li} label={t.li} bg="#0a66c2" />
          <IBtn icon={I.ig} label={t.ig} bg="linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" />
          <IBtn icon={I.yt} label={t.yt} bg="#cc0000" />
          <IBtn icon={I.tg} label={t.tg} bg="#229ed9" />
        </div>
      </div>

      {/* ══ CTA BUTTONS ══════════════════════════════════════ */}
      <div style={{ padding: "0 16px", display: "flex", gap: 8 }}>
        {/* ADD TO CONTACTS */}
        <button className="btn-primary" style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "11px 8px", borderRadius: "var(--r-lg)",
          border: `1.5px solid ${c.accent}`, background: "transparent", color: c.accent,
          fontSize: 9, fontWeight: 800, fontFamily: "var(--font-sans)", letterSpacing: "0.04em", cursor: "pointer",
        }}>
          {I.plus}
          {t.add}
        </button>
        {/* SHARE */}
        <button className="btn-primary" style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "11px 14px", borderRadius: "var(--r-lg)",
          border: "1.5px solid rgba(255,255,255,0.18)", background: "transparent", color: "rgba(255,255,255,0.55)",
          fontSize: 9, fontWeight: 800, fontFamily: "var(--font-sans)", letterSpacing: "0.04em", cursor: "pointer",
        }}>
          {I.share}
          {t.share}
        </button>
      </div>

      {/* Website button */}
      <div style={{ padding: "8px 16px 0" }}>
        <button className="btn-primary" style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "11px", borderRadius: "var(--r-lg)", background: c.accent2, border: "none",
          color: "white", fontSize: 10, fontWeight: 800, fontFamily: "var(--font-sans)", letterSpacing: "0.02em", cursor: "pointer",
        }}>
          {I.web}
          {profile.website}
        </button>
      </div>

      {/* Divider */}
      <div style={{ margin: "16px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5">
          <path d="M20 12a8 8 0 01-8 8M12 4a8 8 0 018 8"/>
          <path d="M16 12a4 4 0 01-4 4M12 8a4 4 0 014 4"/>
          <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.18)" stroke="none"/>
        </svg>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>

      {/* ══ BIO SECTION ═══════════════════════════════════════ */}
      <div style={{ margin: "12px 16px 16px", borderRadius: "var(--r-xl)", overflow: "hidden", background: c.bodyBg }}>
        {/* Mini banner strip */}
        {banner && (
          <div style={{ position: "relative", height: 56, overflow: "hidden" }}>
            <img src={banner} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,${c.bodyBg} 0%,transparent 45%,${c.bodyBg} 100%)` }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: "white", margin: 0, lineHeight: "14px" }}>{profile.orgShort}</p>
                <p style={{ fontSize: 8, color: c.accent, margin: "2px 0 0", lineHeight: "11px" }}>{profile.website}</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: "12px 12px 14px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "white", margin: "0 0 6px" }}>{t.about}</p>
          <p style={{ fontSize: 11, lineHeight: "16px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            {BIO[profile.id] ?? `${profile.organization} — O'zbekiston Respublikasida faoliyat yurituvchi tashkilot.`}
          </p>

          {/* Contacts */}
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { icon: "📞", label: profile.phone },
              { icon: "✉️", label: profile.email },
              { icon: "📍", label: profile.address },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 11, flexShrink: 0, lineHeight: "16px" }}>{row.icon}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: "15px" }}>{row.label}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
            {profile.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
                background: c.accent + "1e", color: c.accent, border: `1px solid ${c.accent}38`,
              }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Socials */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
            {profile.socials.map(s => (
              <span key={s.handle} style={{
                fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 6, fontFamily: "monospace",
                background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)",
              }}>
                {s.handle}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", paddingBottom: 14 }}>
        <span style={{ fontSize: 8, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.12)" }}>
          NFC Digital · flex.com.uz
        </span>
      </div>
    </div>
  );
}

// ── Bio texts ────────────────────────────────────────────────────────────────
const BIO: Record<string, string> = {
  "tashkent-inn": "Toshkent Innovatsiya Markazi — shahar miqyosida innovatsion loyihalar, raqamli iqtisodiyot va texnologik startaplarni qo'llab-quvvatlash uchun tashkil etilgan markaz.",
  "hokimiyat":    "Toshkent shahar hokimiyati — shahar infratuzilmasi, qurilish, kommunal xo'jalik va aholi xizmatlarini boshqaruvchi mahalliy ijroiya organ.",
  "moliya":       "O'zbekiston Respublikasi Moliya Vazirligi — davlat moliya siyosati, byudjet rejalashtirish va soliq-bojxona tizimini boshqaruvchi asosiy idora.",
  "iqtisodiyot":  "ATKRV — axborot texnologiyalari, raqamli infratuzilma va komunikatsiya sohasini rivojlantirishga, investitsiyalarni jalb qilishga mas'ul vazirlik.",
  "raqamli":      "ATKRV — O'zbekistonni raqamlashtirish, e-hukumat xizmatlarini kengaytirish va IT infratuzilmasini modernizatsiya qilishga mas'ul davlat idorasi.",
  "nbu":          "O'zbekiston Respublikasi Markaziy Banki — milliy valyuta barqarorligi, pul-kredit siyosati va mamlakatning butun bank tizimini nazorat qiluvchi davlat muassasasi.",
  "agrobank":     "Agro'sanoat Banki — qishloq xo'jaligi va oziq-ovqat sanoatiga ixtisoslashgan, fermerlar va agrobiznesni kredit bilan ta'minlovchi yetakchi bank.",
  "kapitalbank":  "Kapital Bank — innovatsion raqamli bank xizmatlari, to'lov kartalari va fintech mahsulotlari bilan O'zbekiston bank tizimida zamonaviy yetakchi.",
  "uzv-fund":     "Yoshlar Ventures — yosh tadbirkorlar va texnologiya startaplarini seed va Series A bosqichlarda investitsiya, mentorlik hamda tarmoq bilan qo'llab-quvvatlash.",
  "uzfar":        "United Ventures — iqtisodiy islohotlar va tezkor rivojlanish strategiyalarini ishlab chiqish hamda amalga oshirishga ixtisoslashgan strategik investitsiya fondi.",
  "itpark":       "IT Park Uzbekistan — mamlakatimizdagi IT tarmoqni rivojlantirish, startaplarga inkubatsiya, akseleratsiya va soliq imtiyozlarini taqdim etuvchi asosiy ekotizim.",
  "chamber":      "Startup Garage — yosh tadbirkorlar va startaplarni qo'llab-quvvatlash, biznes akseleratsiya va texnologik loyihalarni rivojlantirishga ixtisoslashgan markaz.",
  "uzreport":     "ICT Week Uzbekistan — axborot-kommunikatsiya texnologiyalari sohasidagi eng yirik yillik xalqaro forum, innovatsiya va raqamlashtirish markazi.",
};
