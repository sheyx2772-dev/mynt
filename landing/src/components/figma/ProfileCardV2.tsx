// Seventeen card designs from the Figma Make project, brought across as they
// are: no hooks, no handlers and no images — every pattern in here is an inline
// SVG data URI, so it renders on the server like the rest of the page.
//
// The only edit is the import path. The theme attribute the earlier catalogue
// had to be renamed for is not used here; these paint from inline styles.
import React from "react";
import type { Profile } from "./profiles";

/* ── SVG pattern generators ─────────────────────────────────────────────────── */
const enc = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const PAT = {
  islamicStar: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><polygon points="40,4 46,26 68,26 51,40 57,62 40,50 23,62 29,40 12,26 34,26" fill="none" stroke="rgba(212,165,55,0.13)" stroke-width="1.2"/><polygon points="40,14 44,28 58,28 47,37 51,51 40,43 29,51 33,37 22,28 36,28" fill="none" stroke="rgba(212,165,55,0.07)" stroke-width="0.8"/></svg>`),
  leafGrid:    enc(`<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70"><path d="M35 8 C52 8 62 28 48 44 C34 60 18 52 18 35 C18 18 35 8 35 8Z" fill="none" stroke="rgba(134,239,172,0.1)" stroke-width="1.5"/><path d="M35 8 L35 44" stroke="rgba(134,239,172,0.07)" stroke-width="0.8"/></svg>`),
  mountainDot: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="1.5" fill="rgba(147,197,253,0.18)"/></svg>`),
  confetti:    enc(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="8" cy="8" r="3" fill="rgba(255,255,255,0.15)"/><circle cx="30" cy="15" r="2" fill="rgba(255,255,255,0.1)"/><rect x="20" y="28" width="5" height="5" rx="1" transform="rotate(30 22 30)" fill="rgba(255,255,255,0.12)"/></svg>`),
  scanlines:   enc(`<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="2" fill="rgba(0,0,0,0.18)"/></svg>`),
  halftone:    enc(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="2.5" fill="rgba(0,0,0,0.12)"/></svg>`),
  music:       enc(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect x="5"  y="30" width="6" height="30" rx="2" fill="rgba(191,0,255,0.08)"/><rect x="17" y="15" width="6" height="45" rx="2" fill="rgba(191,0,255,0.08)"/><rect x="29" y="22" width="6" height="38" rx="2" fill="rgba(191,0,255,0.08)"/><rect x="41" y="8"  width="6" height="52" rx="2" fill="rgba(191,0,255,0.08)"/><rect x="53" y="18" width="6" height="42" rx="2" fill="rgba(191,0,255,0.08)"/></svg>`),
  paintDots:   enc(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="40" cy="30" r="22" fill="#fecdd3" opacity="0.4"/><circle cx="150" cy="60" r="16" fill="#bfdbfe" opacity="0.4"/><circle cx="80" cy="140" r="30" fill="#d9f99d" opacity="0.35"/><circle cx="170" cy="160" r="20" fill="#fde68a" opacity="0.4"/><circle cx="20" cy="170" r="14" fill="#ddd6fe" opacity="0.4"/></svg>`),
};

/* ── Shared icons ───────────────────────────────────────────────────────────── */
const Ic = {
  phone:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.99 1.13 2 2 0 013 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  mail:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>,
  web:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  pin:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  nfc:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 12a8 8 0 01-8 8"/><path d="M12 4a8 8 0 018 8"/><path d="M16 12a4 4 0 01-4 4"/><path d="M12 8a4 4 0 014 4"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>,
  check:  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  plus:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  share:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  star:   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  leaf:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 20A7 7 0 0118 7a7 7 0 00-7 13zM11 20v-7"/></svg>,
  knife:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 2l4 4-4 12 2 4 8-8"/><path d="M15 4l3 3-3.5 3.5"/><path d="M9 12l5 5"/></svg>,
  palette:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  music:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  li:     <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
  ig:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" stroke="none"/></svg>,
  tg:     <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22.05 1.577c-.393-.016-.784.08-1.117.235L2.242 9.842c-.952.38-1.769 1.048-1.769 1.999 0 1.134 1.07 1.585 1.923 1.837l3.986 1.31c.424 1.461 1.368 5.157 1.62 6.246.088.363.25.74.565.946.316.207.766.248 1.07.045l2.034-3.296 3.927 3.15c.568.456 1.21.7 1.857.7.36 0 .72-.078 1.06-.238.69-.32 1.073-.987 1.247-1.733l2.7-13.005c.205-.951.157-1.93-.384-2.668a2.59 2.59 0 00-1.74-1.03z"/></svg>,
  yt:     <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>,
  gh:     <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
  beh:    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.69.757-.637.156-1.3.233-1.99.233H0V4.503h6.938zm-.588 5.5c.577 0 1.05-.135 1.41-.41.358-.278.54-.71.54-1.3 0-.32-.058-.59-.172-.8a1.4 1.4 0 00-.465-.52 1.97 1.97 0 00-.683-.29 3.7 3.7 0 00-.832-.09H2.57v3.41h3.78zm.187 5.862c.32 0 .623-.033.908-.1a2.16 2.16 0 00.756-.33 1.6 1.6 0 00.517-.592c.127-.247.19-.558.19-.932 0-.743-.21-1.27-.627-1.582-.42-.31-.97-.465-1.657-.465H2.57v4.002h4.966zm11.25.554c.317.31.77.463 1.36.463.424 0 .79-.106 1.097-.32.306-.213.494-.44.562-.683h2.515c-.403 1.26-1.02 2.16-1.852 2.702-.833.54-1.837.81-3.015.81-.817 0-1.555-.13-2.213-.39a4.73 4.73 0 01-1.686-1.11 5.05 5.05 0 01-1.07-1.73c-.253-.67-.38-1.41-.38-2.22 0-.79.13-1.52.39-2.18a4.94 4.94 0 011.1-1.715 5.02 5.02 0 011.7-1.125c.65-.267 1.37-.4 2.16-.4.88 0 1.65.17 2.3.508a4.67 4.67 0 011.598 1.38c.42.578.726 1.25.912 2.002.19.752.254 1.548.19 2.39H17.18c0 .668.205 1.18.608 1.613zm2.374-4.926c-.253-.28-.664-.42-1.23-.42-.362 0-.664.06-.91.18a1.87 1.87 0 00-.608.46 1.79 1.79 0 00-.34.617c-.07.217-.11.425-.122.625h3.692c-.082-.614-.232-1.18-.483-1.46zM19.07 6h5.52v1.59H19.07V6z"/></svg>,
};

const SOCIAL_IC: Record<string, React.ReactElement> = {
  linkedin:Ic.li, instagram:Ic.ig, telegram:Ic.tg, youtube:Ic.yt, github:Ic.gh, behance:Ic.beh,
};
const SOCIAL_BG: Record<string, string> = {
  linkedin:"#0a66c2", instagram:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#bc1888)",
  telegram:"#229ed9", youtube:"#cc0000", github:"#24292e", behance:"#1769ff",
};

/* ── Shared sub-components ──────────────────────────────────────────────────── */
function Socials({ s, fg = "#fff" }: { s: Profile["socials"]; fg?: string }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {s.map(item => (
        <div key={item.handle} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 9px", borderRadius:20, background:SOCIAL_BG[item.type]??"#555", color:fg }}>
          {SOCIAL_IC[item.type] ?? Ic.web}
          <span style={{ fontSize:10, fontFamily:"var(--font-mono)" }}>{item.handle}</span>
        </div>
      ))}
    </div>
  );
}
function Tags({ list, bg, color }: { list:string[]; bg:string; color:string }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {list.map(t => (
        <span key={t} style={{ fontSize:10, padding:"4px 11px", borderRadius:20, background:bg, color, fontWeight:700 }}>{t}</span>
      ))}
    </div>
  );
}
function VerBadge({ accent, bg, text }: { accent:string; bg:string; text:string }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:`${accent}18`, border:`1px solid ${accent}40` }}>
      <span style={{ color:accent }}>{Ic.check}</span>
      <span style={{ fontSize:9, color:accent, fontWeight:800, letterSpacing:"0.06em" }}>TASDIQLANGAN</span>
    </div>
  );
}
function NfcFoot({ color = "rgba(255,255,255,0.15)" }: { color?: string }) {
  return (
    <div style={{ textAlign:"center", padding:"10px 0 14px", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
      <span style={{ color }}>{Ic.nfc}</span>
      <span style={{ fontSize:8, fontFamily:"var(--font-mono)", color, letterSpacing:"0.18em", textTransform:"uppercase" }}>FLEX.COM.UZ</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: PREMIUM — luxury hotel-key card, ebony & gold
══════════════════════════════════════════════════════════════════════════════ */
function TplPremium({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)" }}>
      <div style={{ height:3, background:`linear-gradient(90deg,transparent,${v.accent} 30%,${v.accent} 70%,transparent)` }} />
      {/* Split hero */}
      <div style={{ display:"flex", minHeight:220 }}>
        {/* Portrait col */}
        <div style={{ width:148, flexShrink:0, position:"relative", overflow:"hidden" }}>
          <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", minHeight:220 }} />
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(90deg,transparent 55%,${v.bg1} 100%)` }} />
          {/* Monogram watermark */}
          <div style={{ position:"absolute", bottom:12, left:12, fontFamily:"var(--font-serif)", fontSize:44, fontWeight:400, color:`${v.accent}30`, lineHeight:1 }}>{p.logoText}</div>
        </div>
        {/* Content col */}
        <div style={{ flex:1, padding:"28px 20px 20px 16px", display:"flex", flexDirection:"column", justifyContent:"center", gap:10, position:"relative" }}>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:`${v.accent}90`, letterSpacing:"0.22em", textTransform:"uppercase", margin:0 }}>{p.categoryLabel}</p>
          <h2 style={{ fontFamily:"var(--font-serif)", fontSize:21, fontWeight:400, color:v.text, margin:0, lineHeight:1.2, letterSpacing:"-0.2px" }}>{p.fullName}</h2>
          <p style={{ fontSize:11, color:v.sub, margin:0, lineHeight:1.55 }}>{p.position}</p>
          <p style={{ fontSize:11, color:v.accent, fontWeight:600, margin:0 }}>{p.orgShort}</p>
          {p.verified && <VerBadge accent={v.accent} bg={v.bg2} text={v.text} />}
          {/* Gold line */}
          <div style={{ height:1, background:`linear-gradient(90deg,${v.accent}60,transparent)`, marginTop:4 }} />
        </div>
      </div>
      {/* Hairline */}
      <div style={{ margin:"0 20px", height:1, background:`linear-gradient(90deg,${v.accent}30,${v.accent}70,${v.accent}30)` }} />
      {/* Contacts */}
      <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:9 }}>
        {[[Ic.phone, p.phone],[Ic.mail, p.email],[Ic.web, p.website],[Ic.pin, p.address]].map(([ico, val], i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <span style={{ color:v.accent, flexShrink:0, opacity:0.8, marginTop:1 }}>{ico as React.ReactElement}</span>
            <span style={{ fontSize:12, color:v.sub, lineHeight:1.5 }}>{val as string}</span>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"0 20px" }}><Tags list={p.tags} bg={v.tag} color={v.accent} /></div>
      {/* CTA */}
      <div style={{ padding:"18px 20px 20px" }}>
        <button className="press" style={{ width:"100%", padding:"13px", borderRadius:3, background:"transparent", border:`1px solid ${v.accent}60`, color:v.accent, fontWeight:800, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", fontFamily:"var(--font-sans)" }}>
          KONTAKTGA QO'SHISH
        </button>
      </div>
      <NfcFoot color={`${v.accent}35`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: GRADIENT — vivid mesh gradient, heavy glass panel
══════════════════════════════════════════════════════════════════════════════ */
function TplGradient({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:`linear-gradient(135deg,${v.bg1} 0%,${v.bg2} 100%)`, fontFamily:"var(--font-sans)", position:"relative", overflow:"hidden" }}>
      {/* Blob decorations */}
      <div style={{ position:"absolute", top:-80, right:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-60, left:-60, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
      {/* Category label */}
      <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
        <span style={{ fontSize:9, fontFamily:"var(--font-mono)", color:"rgba(255,255,255,0.65)", letterSpacing:"0.2em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, border:"1px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.1)" }}>{p.categoryLabel}</span>
        <span style={{ color:"rgba(255,255,255,0.4)" }}>{Ic.nfc}</span>
      </div>
      {/* Avatar hero */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 20px 0", position:"relative" }}>
        <div style={{ position:"relative", marginBottom:16 }}>
          <div style={{ width:108, height:108, borderRadius:"50%", overflow:"hidden", border:"3.5px solid rgba(255,255,255,0.65)", boxShadow:"0 12px 40px rgba(0,0,0,0.35),0 0 0 6px rgba(255,255,255,0.1)" }}>
            <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
          </div>
          {p.verified && (
            <div style={{ position:"absolute", bottom:2, right:2, width:26, height:26, borderRadius:"50%", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>
              <span style={{ color:v.bg2 }}>{Ic.check}</span>
            </div>
          )}
        </div>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:25, fontWeight:600, color:"#fff", margin:"0 0 6px", textAlign:"center", textShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>{p.fullName}</h2>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.78)", margin:"0 0 4px", textAlign:"center" }}>{p.position}</p>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", margin:0, textAlign:"center" }}>{p.organization}</p>
      </div>
      {/* Glass contact panel */}
      <div style={{ margin:"22px 16px 0", borderRadius:22, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.25)", padding:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website]].map(([ico,val],i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color:"rgba(255,255,255,0.85)", flexShrink:0 }}>{ico as React.ReactElement}</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.88)" }}>{val as string}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.18)" }}>
          <Socials s={p.socials} />
        </div>
      </div>
      {/* Tags */}
      <div style={{ padding:"14px 16px 0" }}>
        <Tags list={p.tags} bg="rgba(255,255,255,0.18)" color="#fff" />
      </div>
      {/* CTA */}
      <div style={{ padding:"16px" }}>
        <button className="press" style={{ width:"100%", padding:"14px", borderRadius:14, background:"rgba(255,255,255,0.95)", border:"none", color:v.bg2, fontWeight:900, fontSize:12, cursor:"pointer", fontFamily:"var(--font-sans)", letterSpacing:"0.04em" }}>
          KONTAKTGA QO'SHISH
        </button>
      </div>
      <NfcFoot color="rgba(255,255,255,0.3)" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: MINIMAL — Swiss/Bauhaus editorial, white card
══════════════════════════════════════════════════════════════════════════════ */
function TplMinimal({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", position:"relative", overflow:"hidden" }}>
      {/* Watermark monogram */}
      <div style={{ position:"absolute", top:-10, right:-10, fontFamily:"var(--font-serif)", fontSize:130, fontWeight:700, color:`${v.accent}07`, lineHeight:1, userSelect:"none", pointerEvents:"none" }}>
        {p.logoText}
      </div>
      {/* Top accent bar */}
      <div style={{ height:4, background:v.accent }} />
      {/* Header row */}
      <div style={{ padding:"24px 28px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ width:48, height:48, borderRadius:12, background:v.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"var(--font-mono)", fontWeight:900, fontSize:16, color:v.bg1 }}>{p.logoText.slice(0,2)}</span>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:9, color:"#aaa", margin:0, fontFamily:"var(--font-mono)", letterSpacing:"0.12em", textTransform:"uppercase" }}>{p.categoryLabel}</p>
          {p.verified && <p style={{ fontSize:9, color:v.accent, fontWeight:800, margin:"3px 0 0", letterSpacing:"0.05em" }}>Tasdiqlangan ✓</p>}
        </div>
      </div>
      {/* Identity */}
      <div style={{ padding:"28px 28px 0", display:"flex", gap:18, alignItems:"flex-start", position:"relative" }}>
        <div style={{ width:76, height:76, borderRadius:"50%", overflow:"hidden", flexShrink:0, border:`3px solid ${v.tag}` }}>
          <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
        </div>
        <div>
          <h2 style={{ fontFamily:"var(--font-serif)", fontSize:22, fontWeight:400, color:v.text, margin:"0 0 7px", lineHeight:1.2 }}>{p.fullName}</h2>
          <p style={{ fontSize:12, color:v.sub, margin:"0 0 4px", lineHeight:1.45 }}>{p.position}</p>
          <p style={{ fontSize:11, color:v.accent, fontWeight:700, margin:0 }}>{p.orgShort}</p>
        </div>
      </div>
      {/* Rule */}
      <div style={{ margin:"22px 28px 0", height:1, background:v.tag }} />
      {/* Contact 2-col grid */}
      <div style={{ padding:"18px 28px 0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px 20px" }}>
        {[{l:"Telefon",v:p.phone},{l:"Veb-sayt",v:p.website},{l:"E-pochta",v:p.email},{l:"Manzil",v:p.address}].map(row=>(
          <div key={row.l}>
            <p style={{ fontSize:8, color:"#bbb", margin:"0 0 3px", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.12em" }}>{row.l}</p>
            <p style={{ fontSize:11, color:v.text, margin:0, lineHeight:1.4, wordBreak:"break-all" }}>{row.v}</p>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"16px 28px 0" }}><Tags list={p.tags} bg={v.tag} color={v.sub} /></div>
      {/* Socials */}
      <div style={{ padding:"14px 28px" }}><Socials s={p.socials} fg={v.text} /></div>
      {/* CTA */}
      <div style={{ padding:"0 28px 28px", display:"flex", gap:10 }}>
        <button className="press" style={{ flex:1, padding:"13px", borderRadius:3, background:v.accent, border:"none", color:v.bg1, fontWeight:900, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer", fontFamily:"var(--font-sans)" }}>
          Kontaktga qo'shish
        </button>
        <button className="press" style={{ width:44, padding:"13px", borderRadius:3, background:v.tag, border:"none", color:v.sub, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {Ic.share}
        </button>
      </div>
      <div style={{ borderTop:`1px solid ${v.tag}`, padding:"10px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:8, fontFamily:"var(--font-mono)", color:"#ccc", letterSpacing:"0.18em" }}>FLEX.COM.UZ</span>
        <span style={{ color:"#ccc" }}>{Ic.nfc}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: GLASS — cyberpunk, grid lines, neon glow
══════════════════════════════════════════════════════════════════════════════ */
function TplGlass({ p }: { p: Profile }) {
  const v = p.v2!;
  const gridBg = enc(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><line x1="0" y1="0" x2="40" y2="0" stroke="rgba(0,229,255,0.05)" stroke-width="1"/><line x1="0" y1="0" x2="0" y2="40" stroke="rgba(0,229,255,0.05)" stroke-width="1"/></svg>`);
  return (
    <div style={{ background:v.bg1, backgroundImage:gridBg, fontFamily:"var(--font-sans)", position:"relative", overflow:"hidden" }}>
      {/* Neon top glow */}
      <div style={{ position:"absolute", top:-30, left:"50%", transform:"translateX(-50%)", width:300, height:120, background:`radial-gradient(ellipse,${v.accent}22 0%,transparent 70%)`, pointerEvents:"none" }} />
      {/* Scanlines overlay */}
      <div style={{ position:"absolute", inset:0, backgroundImage:PAT.scanlines, opacity:0.4, pointerEvents:"none", mixBlendMode:"multiply" }} />
      {/* Header */}
      <div style={{ padding:"18px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:`${v.accent}aa`, letterSpacing:"0.2em" }}>flex/{p.id}</span>
        <span style={{ color:`${v.accent}66` }}>{Ic.nfc}</span>
      </div>
      {/* Avatar + identity */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 20px 0", position:"relative" }}>
        <div style={{ position:"relative", marginBottom:16 }}>
          {/* Neon rings */}
          <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`1px solid ${v.accent}25` }} />
          <div style={{ position:"absolute", inset:-12, borderRadius:"50%", border:`1px solid ${v.accent}12` }} />
          <div style={{ width:92, height:92, borderRadius:"50%", overflow:"hidden", border:`2px solid ${v.accent}80`, boxShadow:`0 0 24px ${v.accent}50,0 0 60px ${v.accent}20` }}>
            <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
          </div>
        </div>
        <p style={{ fontSize:10, fontFamily:"var(--font-mono)", color:v.accent, letterSpacing:"0.18em", textTransform:"uppercase", margin:"0 0 8px" }}>{p.categoryLabel}</p>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:22, fontWeight:600, color:v.text, margin:"0 0 6px", textAlign:"center", textShadow:`0 0 20px ${v.accent}60` }}>{p.fullName}</h2>
        <p style={{ fontSize:11, color:v.sub, margin:0, textAlign:"center", fontFamily:"var(--font-mono)" }}>{p.position}</p>
      </div>
      {/* Action icons row */}
      <div style={{ padding:"22px 20px 0", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[[Ic.phone,"Qo'ng'iroq"],[Ic.mail,"E-pochta"],[Ic.web,"Sayt"],[Ic.pin,"Manzil"]].map(([ico,label],i)=>(
          <div key={i} className="press" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer" }}>
            <div style={{ width:50, height:50, borderRadius:14, background:`rgba(0,229,255,0.06)`, backdropFilter:"blur(12px)", border:`1px solid ${v.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", color:v.accent, boxShadow:`0 0 12px ${v.accent}20` }}>
              {ico as React.ReactElement}
            </div>
            <span style={{ fontSize:8, color:v.sub, fontFamily:"var(--font-mono)", textAlign:"center" }}>{label as string}</span>
          </div>
        ))}
      </div>
      {/* Glass info panel */}
      <div style={{ margin:"18px 16px 0", borderRadius:16, background:"rgba(255,255,255,0.03)", border:`1px solid ${v.accent}18`, padding:16, backdropFilter:"blur(8px)" }}>
        {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website]].map(([ico,val],i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:i<2?10:0 }}>
            <span style={{ color:`${v.accent}88`, flexShrink:0 }}>{ico as React.ReactElement}</span>
            <span style={{ fontSize:11, color:v.sub, fontFamily:"var(--font-mono)" }}>{val as string}</span>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"14px 16px 0" }}><Tags list={p.tags} bg={v.tag} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 16px" }}><Socials s={p.socials} /></div>
      {/* CTA */}
      <div style={{ padding:"0 16px 16px" }}>
        <button className="press" style={{ width:"100%", padding:"13px", borderRadius:10, background:v.accent, border:"none", color:v.bg1, fontWeight:900, fontSize:12, cursor:"pointer", fontFamily:"var(--font-mono)", letterSpacing:"0.08em", boxShadow:`0 0 20px ${v.accent}60` }}>
          ./SAVE-CONTACT --NFC
        </button>
      </div>
      <NfcFoot color={`${v.accent}40`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: STRIPE — bold left color stripe, Swiss grid
══════════════════════════════════════════════════════════════════════════════ */
function TplStripe({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", display:"flex" }}>
      {/* Left stripe with avatar */}
      <div style={{ width:72, flexShrink:0, background:v.accent, display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 0 16px", gap:0 }}>
        {/* Category vertical text */}
        <p style={{ fontSize:7, fontWeight:900, color:v.bg1, letterSpacing:"0.25em", textTransform:"uppercase", writingMode:"vertical-lr", transform:"rotate(180deg)", margin:"0 0 16px", opacity:0.7 }}>{p.categoryLabel}</p>
        {/* Avatar */}
        <div style={{ width:50, height:50, borderRadius:12, overflow:"hidden", border:`2.5px solid ${v.bg1}`, boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>
          <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
        </div>
        {p.verified && (
          <div style={{ marginTop:8, width:20, height:20, borderRadius:"50%", background:v.bg1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:v.accent }}>{Ic.check}</span>
          </div>
        )}
        {/* NFC symbol at bottom */}
        <div style={{ marginTop:"auto", color:`${v.bg1}70` }}>{Ic.nfc}</div>
      </div>
      {/* Right content */}
      <div style={{ flex:1, overflow:"hidden" }}>
        <div style={{ padding:"24px 22px 0" }}>
          <h2 style={{ fontFamily:"var(--font-serif)", fontSize:21, fontWeight:500, color:v.text, margin:"0 0 5px", lineHeight:1.2 }}>{p.fullName}</h2>
          <p style={{ fontSize:11, color:v.sub, margin:"0 0 3px", lineHeight:1.45 }}>{p.position}</p>
          <p style={{ fontSize:11, color:v.accent, fontWeight:800, margin:0 }}>{p.orgShort}</p>
        </div>
        <div style={{ margin:"16px 22px", height:1.5, background:`linear-gradient(90deg,${v.accent},transparent)` }} />
        {/* Contact grid */}
        <div style={{ padding:"0 22px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 16px" }}>
          {[{l:"Telefon",v2:p.phone},{l:"Sayt",v2:p.website},{l:"E-pochta",v2:p.email},{l:"Joylashuv",v2:p.address}].map(r=>(
            <div key={r.l}>
              <p style={{ fontSize:8, color:"#aaa", margin:"0 0 2px", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{r.l}</p>
              <p style={{ fontSize:10, color:v.text, margin:0, lineHeight:1.4, wordBreak:"break-all" }}>{r.v2}</p>
            </div>
          ))}
        </div>
        <div style={{ padding:"14px 22px 0" }}><Tags list={p.tags} bg={v.tag} color={v.sub} /></div>
        <div style={{ padding:"12px 22px" }}><Socials s={p.socials} fg={v.text} /></div>
        <div style={{ padding:"0 22px 22px" }}>
          <button className="press" style={{ width:"100%", padding:"12px", borderRadius:4, background:v.accent, border:"none", color:v.bg1, fontWeight:900, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer", fontFamily:"var(--font-sans)" }}>
            Kontaktga qo'shish
          </button>
        </div>
        <div style={{ borderTop:`1px solid ${v.tag}`, padding:"8px 22px", display:"flex", justifyContent:"flex-end" }}>
          <span style={{ fontSize:8, fontFamily:"var(--font-mono)", color:"#ccc", letterSpacing:"0.15em" }}>FLEX.COM.UZ</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: FEMININE — editorial rose, organic curves
══════════════════════════════════════════════════════════════════════════════ */
function TplFeminine({ p }: { p: Profile }) {
  const v = p.v2!;
  const isMedical = v.accent === "#2563eb";
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden" }}>
      {/* Top organic blob */}
      <div style={{ position:"relative", height:160, overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(160deg,${v.accent}28 0%,${v.bg2} 100%)` }} />
        <div style={{ position:"absolute", top:-70, left:-70, width:220, height:220, borderRadius:"50%", background:`${v.accent}14` }} />
        <div style={{ position:"absolute", top:-40, right:-50, width:160, height:160, borderRadius:"50%", background:`${v.accent}0a` }} />
        {/* Category float */}
        <div style={{ position:"absolute", top:16, left:20 }}>
          <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, background:`${v.accent}`, color:"#fff" }}>{p.categoryLabel}</span>
        </div>
        {/* Avatar centered */}
        <div style={{ position:"absolute", bottom:-44, left:"50%", transform:"translateX(-50%)" }}>
          <div style={{ position:"relative" }}>
            <div style={{ width:100, height:100, borderRadius:"50%", overflow:"hidden", border:`4px solid #fff`, boxShadow:`0 6px 32px ${v.accent}40` }}>
              <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
            </div>
            {p.verified && (
              <div style={{ position:"absolute", bottom:2, right:2, width:24, height:24, borderRadius:"50%", background:v.accent, border:"2.5px solid #fff", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
                {Ic.check}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Identity */}
      <div style={{ textAlign:"center", padding:"52px 24px 0" }}>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:24, fontWeight:isMedical?600:400, color:v.text, margin:"0 0 5px" }}>{p.fullName}</h2>
        <p style={{ fontSize:12, color:v.sub, margin:"0 0 4px", lineHeight:1.5 }}>{p.position}</p>
        <p style={{ fontSize:11, color:v.accent, fontWeight:700, margin:0 }}>{p.organization}</p>
      </div>
      {/* Pill divider */}
      <div style={{ display:"flex", justifyContent:"center", padding:"14px 0" }}>
        <div style={{ width:36, height:3.5, borderRadius:99, background:`${v.accent}44` }} />
      </div>
      {/* Contact cards 2x2 */}
      <div style={{ padding:"0 18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[[Ic.phone,"Telefon",p.phone],[Ic.mail,"E-pochta",p.email],[Ic.web,"Veb-sayt",p.website],[Ic.pin,"Manzil",p.address]].map(([ico,label,val],i)=>(
          <div key={i} style={{ background:v.bg2, borderRadius:16, padding:"12px 14px", border:`1.5px solid ${v.accent}18` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
              <span style={{ color:v.accent }}>{ico as React.ReactElement}</span>
              <span style={{ fontSize:8, color:v.accent, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em" }}>{label as string}</span>
            </div>
            <p style={{ fontSize:10, color:v.sub, margin:0, lineHeight:1.4, wordBreak:"break-all" }}>{val as string}</p>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"14px 18px 0", display:"flex", justifyContent:"center" }}><Tags list={p.tags} bg={v.tag} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 18px", display:"flex", justifyContent:"center" }}><Socials s={p.socials} /></div>
      {/* CTA */}
      <div style={{ padding:"0 18px 22px" }}>
        <button className="press" style={{ width:"100%", padding:"14px", borderRadius:40, background:v.accent, border:"none", color:"#fff", fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"var(--font-sans)" }}>
          Kontaktga qo'shish
        </button>
      </div>
      <NfcFoot color={`${v.accent}45`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: TERMINAL — phosphor green, scanlines, monospace throughout
══════════════════════════════════════════════════════════════════════════════ */
function TplTerminal({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-mono)", position:"relative", overflow:"hidden" }}>
      {/* Scanlines */}
      <div style={{ position:"absolute", inset:0, backgroundImage:PAT.scanlines, opacity:0.6, pointerEvents:"none" }} />
      {/* Green glow */}
      <div style={{ position:"absolute", top:-20, left:"50%", transform:"translateX(-50%)", width:250, height:100, background:`radial-gradient(ellipse,${v.accent}18 0%,transparent 70%)`, pointerEvents:"none" }} />
      {/* Terminal chrome */}
      <div style={{ background:"#0a110a", borderBottom:`1px solid ${v.accent}25`, padding:"10px 16px", display:"flex", alignItems:"center", gap:8, position:"relative" }}>
        <div style={{ width:10, height:10, borderRadius:"50%", background:"#ff5f57" }} />
        <div style={{ width:10, height:10, borderRadius:"50%", background:"#ffbd2e" }} />
        <div style={{ width:10, height:10, borderRadius:"50%", background:"#28ca41" }} />
        <span style={{ marginLeft:10, fontSize:10, color:`${v.accent}70` }}>flex.com.uz — nfc profile</span>
        <span style={{ marginLeft:"auto", color:`${v.accent}50` }}>{Ic.nfc}</span>
      </div>
      {/* Main layout */}
      <div style={{ padding:"18px 16px 0", display:"flex", gap:16, position:"relative" }}>
        {/* Avatar */}
        <div style={{ flexShrink:0 }}>
          <div style={{ width:76, height:76, borderRadius:10, overflow:"hidden", border:`1px solid ${v.accent}40`, filter:"grayscale(20%) sepia(15%) brightness(0.9)" }}>
            <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
          </div>
          <div style={{ marginTop:6, padding:"4px 0", textAlign:"center" }}>
            <span style={{ fontSize:8, color:`${v.accent}80` }}>{p.verified?"[verified]":"[active]"}</span>
          </div>
        </div>
        {/* Terminal lines */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
          {[
            {k:"id",    val:p.id},
            {k:"name",  val:p.fullName},
            {k:"role",  val:p.position},
            {k:"org",   val:p.orgShort},
          ].map((r,i)=>(
            <p key={i} style={{ margin:0, fontSize:i<2?11:10, color:i<2?v.text:v.sub, lineHeight:1.5 }}>
              <span style={{ color:`${v.accent}70` }}>{r.k}: </span>
              <span style={{ color:i===0?v.accent:undefined }}>{r.val}</span>
            </p>
          ))}
        </div>
      </div>
      {/* Separator */}
      <div style={{ margin:"14px 16px 0", height:1, background:`${v.accent}18` }} />
      {/* Contact block */}
      <div style={{ padding:"12px 16px 0", position:"relative" }}>
        <p style={{ fontSize:9, color:`${v.accent}60`, margin:"0 0 8px" }}># contact</p>
        {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website]].map(([ico,val],i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
            <span style={{ color:`${v.accent}80` }}>{ico as React.ReactElement}</span>
            <span style={{ fontSize:11, color:v.sub }}>{val as string}</span>
          </div>
        ))}
      </div>
      {/* Tags block */}
      <div style={{ margin:"12px 16px 0", background:"#0a110a", borderRadius:8, padding:12, border:`1px solid ${v.accent}18` }}>
        <p style={{ fontSize:9, color:`${v.accent}60`, margin:"0 0 8px" }}># tags</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {p.tags.map(t=><span key={t} style={{ fontSize:9, padding:"3px 8px", borderRadius:3, background:`${v.accent}12`, color:v.accent, border:`1px solid ${v.accent}28` }}>{t}</span>)}
        </div>
      </div>
      {/* Socials */}
      <div style={{ margin:"10px 16px 0", background:"#0a110a", borderRadius:8, padding:12, border:`1px solid ${v.accent}18` }}>
        <p style={{ fontSize:9, color:`${v.accent}60`, margin:"0 0 8px" }}># socials</p>
        {p.socials.map(s=><p key={s.handle} style={{ fontSize:10, color:v.sub, margin:"0 0 4px" }}><span style={{ color:`${v.accent}80` }}>{s.type}: </span>{s.handle}</p>)}
      </div>
      {/* CTA */}
      <div style={{ padding:"14px 16px" }}>
        <button className="press" style={{ width:"100%", padding:"12px", borderRadius:6, background:"transparent", border:`1px solid ${v.accent}`, color:v.accent, fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"var(--font-mono)", letterSpacing:"0.08em", boxShadow:`0 0 16px ${v.accent}30,inset 0 0 16px ${v.accent}08` }}>
          ./save-contact --nfc --format=vcard
        </button>
      </div>
      <div style={{ padding:"0 16px 14px", display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ color:`${v.accent}50` }}>{Ic.nfc}</span>
        <span style={{ fontSize:8, color:`${v.accent}40`, letterSpacing:"0.15em" }}>NFC · FLEX.COM.UZ</span>
        <span style={{ color:v.accent, animation:"dot-blink 1.2s ease infinite" }}>▮</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: COMIC — Ben-Day dots, pop-art energy
══════════════════════════════════════════════════════════════════════════════ */
function TplComic({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden" }}>
      {/* Halftone header */}
      <div style={{ background:v.accent, padding:"22px 20px 18px", position:"relative", overflow:"hidden", borderBottom:`3px solid ${v.text}` }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:PAT.halftone, opacity:0.4 }} />
        <div style={{ position:"relative" }}>
          <p style={{ fontSize:10, fontWeight:900, color:`${v.text}80`, margin:"0 0 4px", letterSpacing:"0.2em", textTransform:"uppercase" }}>{p.categoryLabel}</p>
          <h2 style={{ fontFamily:"var(--font-sans)", fontSize:26, fontWeight:900, color:v.text, margin:"0 0 4px", letterSpacing:"-0.6px", lineHeight:1.1 }}>{p.fullName}</h2>
          <p style={{ fontSize:12, color:`${v.text}80`, margin:0, fontWeight:600 }}>{p.position}</p>
        </div>
        {/* Speech bubble tail */}
        <div style={{ position:"absolute", bottom:-18, right:24, width:0, height:0, borderLeft:"12px solid transparent", borderRight:"12px solid transparent", borderTop:`18px solid ${v.accent}` }} />
      </div>
      {/* Avatar + org row */}
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"22px 18px 16px", background:v.bg2, borderBottom:`2px solid ${v.text}22` }}>
        <div style={{ width:68, height:68, borderRadius:16, overflow:"hidden", border:`3px solid ${v.accent}`, flexShrink:0, boxShadow:`4px 4px 0 ${v.text}25` }}>
          <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
        </div>
        <div>
          <p style={{ fontSize:15, fontWeight:900, color:v.text, margin:"0 0 3px" }}>{p.orgShort}</p>
          <p style={{ fontSize:11, color:v.sub, margin:"0 0 3px" }}>{p.website}</p>
          {p.verified && <span style={{ fontSize:9, fontWeight:900, color:v.accent, background:v.text, padding:"2px 8px", borderRadius:20 }}>✓ TASDIQLANGAN</span>}
        </div>
      </div>
      {/* Big contact boxes */}
      <div style={{ padding:"14px 14px 0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[["📞","Qo'ng'iroq",p.phone],["✉️","Yozish",p.email],["🌐","Sayt",p.website],["📍","Manzil",p.address]].map(([emoji,label,val],i)=>(
          <div key={i} className="press" style={{ background:"#fff", borderRadius:14, padding:"12px 14px", border:`2.5px solid ${v.accent}`, cursor:"pointer", boxShadow:`3px 3px 0 ${v.accent}88` }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{emoji as string}</div>
            <p style={{ fontSize:8, fontWeight:900, color:v.accent, margin:"0 0 3px", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label as string}</p>
            <p style={{ fontSize:10, color:v.sub, margin:0, wordBreak:"break-all", lineHeight:1.4 }}>{val as string}</p>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"12px 14px 0" }}><Tags list={p.tags} bg={v.tag} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 14px" }}><Socials s={p.socials} /></div>
      {/* Big CTA */}
      <div style={{ padding:"0 14px 18px" }}>
        <button className="press" style={{ width:"100%", padding:"16px", borderRadius:16, background:v.accent, border:`3px solid ${v.text}`, color:v.text, fontWeight:900, fontSize:14, cursor:"pointer", fontFamily:"var(--font-sans)", letterSpacing:"-0.3px", boxShadow:`4px 4px 0 ${v.text}40` }}>
          Kontaktga qo'shish
        </button>
      </div>
      <div style={{ textAlign:"center", paddingBottom:14, borderTop:`2px solid ${v.tag}` }}>
        <span style={{ fontSize:9, fontFamily:"var(--font-mono)", color:v.sub }}>flex.com.uz · NFC vizitka</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: SPORT — volt yellow + black, diagonal stripe, athletic
══════════════════════════════════════════════════════════════════════════════ */
function TplSport({ p }: { p: Profile }) {
  const v = p.v2!;
  const jerseyNum = p.extra?.jerseyNum ?? "01";
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden" }}>
      {/* Hero: full-bleed photo with diagonal overlay */}
      <div style={{ position:"relative", height:240, overflow:"hidden" }}>
        <img src={p.avatar} alt={p.fullName} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", filter:"contrast(1.1) brightness(0.85)" }} />
        {/* Diagonal slash */}
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(155deg,transparent 45%,${v.bg1} 45%)` }} />
        {/* Top accent bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:v.accent }} />
        {/* Giant jersey number */}
        <div style={{ position:"absolute", top:"50%", right:16, transform:"translateY(-50%)", fontFamily:"var(--font-sans)", fontSize:100, fontWeight:900, color:`${v.accent}20`, lineHeight:1, userSelect:"none" }}>
          {jerseyNum}
        </div>
        {/* Category badge */}
        <div style={{ position:"absolute", top:16, left:16 }}>
          <span style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", padding:"5px 14px", borderRadius:3, background:v.accent, color:v.bg1 }}>
            {p.categoryLabel}
          </span>
        </div>
      </div>
      {/* Identity (over diagonal area) */}
      <div style={{ padding:"14px 20px 0" }}>
        <h2 style={{ fontFamily:"var(--font-sans)", fontSize:28, fontWeight:900, color:v.text, margin:"0 0 4px", letterSpacing:"-0.8px", lineHeight:1, textTransform:"uppercase" }}>
          {p.fullName}
        </h2>
        <p style={{ fontSize:12, color:v.sub, margin:"0 0 3px" }}>{p.position}</p>
        <p style={{ fontSize:11, color:v.accent, fontWeight:800, margin:0 }}>{p.orgShort}</p>
      </div>
      {/* Accent rule */}
      <div style={{ margin:"14px 20px 0", height:2, background:`linear-gradient(90deg,${v.accent},${v.accent}44,transparent)` }} />
      {/* Contact */}
      <div style={{ padding:"12px 20px 0", display:"flex", flexDirection:"column", gap:8 }}>
        {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website]].map(([ico,val],i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:v.bg2, border:`1px solid ${v.accent}18` }}>
            <span style={{ color:v.accent }}>{ico as React.ReactElement}</span>
            <span style={{ fontSize:12, color:v.sub, fontFamily:"var(--font-mono)" }}>{val as string}</span>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"12px 20px 0" }}><Tags list={p.tags} bg={v.tag} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 20px" }}><Socials s={p.socials} /></div>
      {/* CTA */}
      <div style={{ padding:"0 20px 20px" }}>
        <button className="press" style={{ width:"100%", padding:"15px", borderRadius:6, background:v.accent, border:"none", color:v.bg1, fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"var(--font-sans)", letterSpacing:"0.06em", textTransform:"uppercase" }}>
          KONTAKTGA QO'SHISH
        </button>
      </div>
      <NfcFoot color={`${v.accent}44`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: KIDS — rainbow gradient, confetti, playful stars
══════════════════════════════════════════════════════════════════════════════ */
function TplKids({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:`linear-gradient(135deg,${v.bg1} 0%,${v.bg2} 100%)`, fontFamily:"var(--font-sans)", overflow:"hidden", position:"relative" }}>
      {/* Confetti background */}
      <div style={{ position:"absolute", inset:0, backgroundImage:PAT.confetti, pointerEvents:"none" }} />
      {/* Floating stars */}
      {[{top:12,left:18,size:18},{top:20,right:22,size:14},{top:50,left:10,size:12},{bottom:80,right:14,size:16}].map((s,i)=>(
        <div key={i} style={{ position:"absolute", ...s, color:"rgba(255,255,255,0.35)", animation:`spin-slow ${4+i*1.5}s linear infinite` }}>{Ic.star}</div>
      ))}
      {/* Category badge */}
      <div style={{ padding:"18px 18px 0", display:"flex", justifyContent:"center", position:"relative" }}>
        <span style={{ fontSize:10, fontWeight:900, color:v.text, padding:"5px 16px", borderRadius:20, background:"rgba(255,255,255,0.25)", border:"2px solid rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase" }}>
          ⭐ {p.categoryLabel} ⭐
        </span>
      </div>
      {/* Big avatar with gradient ring */}
      <div style={{ display:"flex", justifyContent:"center", padding:"18px 0 0", position:"relative" }}>
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", inset:-4, borderRadius:"50%", background:"linear-gradient(45deg,#fbbf24,#f87171,#a78bfa,#34d399,#60a5fa)", animation:"spin-slow 6s linear infinite" }} />
          <div style={{ position:"absolute", inset:-1, borderRadius:"50%", background:"rgba(255,255,255,0.2)" }} />
          <div style={{ width:100, height:100, borderRadius:"50%", overflow:"hidden", border:"4px solid white", position:"relative" }}>
            <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
          </div>
          {p.verified && (
            <div style={{ position:"absolute", bottom:2, right:2, width:26, height:26, borderRadius:"50%", background:v.accent, border:"3px solid white", display:"flex", alignItems:"center", justifyContent:"center", color:v.bg2, fontSize:14, fontWeight:900 }}>✓</div>
          )}
        </div>
      </div>
      {/* Identity */}
      <div style={{ textAlign:"center", padding:"14px 20px 0", position:"relative" }}>
        <h2 style={{ fontFamily:"var(--font-sans)", fontSize:23, fontWeight:900, color:"#fff", margin:"0 0 4px", textShadow:"0 2px 12px rgba(0,0,0,0.2)" }}>{p.fullName}</h2>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.82)", margin:"0 0 4px" }}>{p.position}</p>
        <p style={{ fontSize:11, color:v.accent, fontWeight:900, margin:0 }}>{p.organization}</p>
      </div>
      {/* Big chunky contact boxes */}
      <div style={{ padding:"16px 14px 0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, position:"relative" }}>
        {[["📞",p.phone],["✉️",p.email],["🌐",p.website],["📍",p.address]].map(([e,val],i)=>(
          <div key={i} className="press" style={{ background:"rgba(255,255,255,0.2)", backdropFilter:"blur(12px)", borderRadius:18, padding:"12px 14px", border:"2px solid rgba(255,255,255,0.4)", cursor:"pointer" }}>
            <div style={{ fontSize:22, marginBottom:5 }}>{e as string}</div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.9)", margin:0, wordBreak:"break-all", lineHeight:1.4, fontWeight:600 }}>{val as string}</p>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"12px 14px 0", display:"flex", justifyContent:"center" }}>
        <Tags list={p.tags} bg="rgba(255,255,255,0.22)" color="#fff" />
      </div>
      {/* Socials */}
      <div style={{ padding:"12px 14px", display:"flex", justifyContent:"center" }}><Socials s={p.socials} /></div>
      {/* CTA */}
      <div style={{ padding:"0 14px 18px" }}>
        <button className="press" style={{ width:"100%", padding:"16px", borderRadius:24, background:"rgba(255,255,255,0.95)", border:"none", color:v.bg2, fontWeight:900, fontSize:14, cursor:"pointer", fontFamily:"var(--font-sans)", boxShadow:"0 6px 24px rgba(0,0,0,0.2)" }}>
          🌟 Kontaktga qo'shish 🌟
        </button>
      </div>
      <NfcFoot color="rgba(255,255,255,0.35)" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: NATURE — forest depth, leaf patterns, organic
══════════════════════════════════════════════════════════════════════════════ */
function TplNature({ p }: { p: Profile }) {
  const v = p.v2!;
  const isMountain = v.accent === "#93c5fd";
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden", position:"relative" }}>
      {/* Leaf/dot pattern */}
      <div style={{ position:"absolute", inset:0, backgroundImage:isMountain?PAT.mountainDot:PAT.leafGrid, pointerEvents:"none" }} />
      {/* Top photo strip */}
      <div style={{ position:"relative", height:150, overflow:"hidden" }}>
        <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(180deg,transparent 30%,${v.bg1} 100%)` }} />
        {/* Category pill */}
        <div style={{ position:"absolute", top:14, left:16 }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, background:`${v.accent}`, color:v.bg1, display:"flex", alignItems:"center", gap:5 }}>
            {Ic.leaf}{p.categoryLabel}
          </span>
        </div>
      </div>
      {/* Identity below photo */}
      <div style={{ padding:"8px 22px 0", position:"relative" }}>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:23, fontWeight:600, color:v.text, margin:"0 0 5px", lineHeight:1.2 }}>{p.fullName}</h2>
        <p style={{ fontSize:12, color:v.sub, margin:"0 0 4px", lineHeight:1.5 }}>{p.position}</p>
        <p style={{ fontSize:11, color:v.accent, fontWeight:700, margin:0 }}>{p.orgShort}</p>
        {p.verified && <div style={{ marginTop:8 }}><VerBadge accent={v.accent} bg={v.bg2} text={v.text} /></div>}
      </div>
      {/* Organic divider */}
      <div style={{ margin:"16px 22px", height:1.5, borderRadius:99, background:`linear-gradient(90deg,${v.accent}60,${v.accent}20,transparent)` }} />
      {/* Contact rows */}
      <div style={{ padding:"0 22px", display:"flex", flexDirection:"column", gap:9 }}>
        {[[Ic.phone,p.phone,"Telefon"],[Ic.mail,p.email,"E-pochta"],[Ic.web,p.website,"Veb-sayt"],[Ic.pin,p.address,"Manzil"]].map(([ico,val,lbl],i)=>(
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 14px", borderRadius:12, background:`${v.accent}10`, border:`1px solid ${v.accent}20` }}>
            <span style={{ color:v.accent, flexShrink:0, marginTop:1 }}>{ico as React.ReactElement}</span>
            <div>
              <p style={{ fontSize:8, color:`${v.accent}90`, fontWeight:700, margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.08em" }}>{lbl as string}</p>
              <p style={{ fontSize:11, color:v.sub, margin:0, lineHeight:1.4 }}>{val as string}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"14px 22px 0" }}><Tags list={p.tags} bg={`${v.accent}14`} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 22px" }}><Socials s={p.socials} /></div>
      {/* CTA */}
      <div style={{ padding:"0 22px 22px" }}>
        <button className="press" style={{ width:"100%", padding:"14px", borderRadius:12, background:v.accent, border:"none", color:v.bg1, fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"var(--font-sans)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {Ic.leaf} Kontaktga qo'shish
        </button>
      </div>
      <NfcFoot color={`${v.accent}40`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: HISTORICAL — Islamic geometric pattern, aged gold, teal
══════════════════════════════════════════════════════════════════════════════ */
function TplHistorical({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden", position:"relative" }}>
      {/* Islamic star pattern */}
      <div style={{ position:"absolute", inset:0, backgroundImage:PAT.islamicStar, backgroundSize:"80px 80px", pointerEvents:"none" }} />
      {/* Gold top bar */}
      <div style={{ height:3, background:`linear-gradient(90deg,transparent,${v.accent},${v.accent},transparent)` }} />
      {/* Header */}
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:8, background:`${v.accent}22`, border:`1px solid ${v.accent}50`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"var(--font-serif)", fontWeight:700, fontSize:15, color:v.accent }}>{p.logoText.slice(0,2)}</span>
          </div>
          <span style={{ fontSize:10, fontFamily:"var(--font-mono)", color:`${v.accent}88`, letterSpacing:"0.14em", textTransform:"uppercase" }}>{p.categoryLabel}</span>
        </div>
        {p.verified && (
          <span style={{ fontSize:9, color:v.accent, fontWeight:700, border:`1px solid ${v.accent}55`, padding:"3px 10px", borderRadius:3 }}>Tasdiqlangan</span>
        )}
      </div>
      {/* Avatar in octagonal clip */}
      <div style={{ display:"flex", justifyContent:"center", padding:"24px 0 0", position:"relative" }}>
        <div style={{ position:"relative" }}>
          {/* Decorative octagon ring */}
          <div style={{ position:"absolute", inset:-8, background:`${v.accent}15`, border:`1px solid ${v.accent}30`, clipPath:"polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)" }} />
          <div style={{ width:96, height:96, overflow:"hidden", border:`2px solid ${v.accent}`, clipPath:"polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)" }}>
            <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
          </div>
        </div>
      </div>
      {/* Gold ornament */}
      <div style={{ textAlign:"center", padding:"12px 24px 0" }}>
        <div style={{ color:`${v.accent}60`, fontSize:18, letterSpacing:"0.4em" }}>✦ ✦ ✦</div>
      </div>
      {/* Identity */}
      <div style={{ textAlign:"center", padding:"10px 24px 0", position:"relative" }}>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:22, fontWeight:600, color:v.text, margin:"0 0 6px", lineHeight:1.2 }}>{p.fullName}</h2>
        <p style={{ fontSize:12, color:v.sub, margin:"0 0 4px", lineHeight:1.5 }}>{p.position}</p>
        <p style={{ fontSize:11, color:v.accent, fontWeight:600, margin:0 }}>{p.organization}</p>
      </div>
      {/* Gold divider */}
      <div style={{ margin:"16px 24px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:`${v.accent}30` }} />
        <div style={{ color:`${v.accent}60`, fontSize:12 }}>◆</div>
        <div style={{ flex:1, height:1, background:`${v.accent}30` }} />
      </div>
      {/* Contacts */}
      <div style={{ padding:"0 24px", display:"flex", flexDirection:"column", gap:9 }}>
        {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website],[Ic.pin,p.address]].map(([ico,val],i)=>(
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <span style={{ color:v.accent, flexShrink:0, marginTop:1, opacity:0.8 }}>{ico as React.ReactElement}</span>
            <span style={{ fontSize:12, color:v.sub, lineHeight:1.5 }}>{val as string}</span>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"14px 24px 0" }}><Tags list={p.tags} bg={`${v.accent}12`} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 24px" }}><Socials s={p.socials} /></div>
      {/* CTA */}
      <div style={{ padding:"0 24px 24px" }}>
        <button className="press" style={{ width:"100%", padding:"14px", borderRadius:4, background:"transparent", border:`1px solid ${v.accent}70`, color:v.accent, fontWeight:700, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", fontFamily:"var(--font-serif)" }}>
          KONTAKTGA QO'SHISH
        </button>
      </div>
      <div style={{ borderTop:`1px solid ${v.accent}20`, textAlign:"center", padding:"10px 0 14px" }}>
        <span style={{ fontSize:8, fontFamily:"var(--font-mono)", color:`${v.accent}40`, letterSpacing:"0.2em" }}>flex.com.uz · NFC</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: COUNTRY — flag split, diplomatic card
══════════════════════════════════════════════════════════════════════════════ */
function TplCountry({ p }: { p: Profile }) {
  const v = p.v2!;
  const flag = p.extra?.flag ?? "🌍";
  const country = p.extra?.country ?? "";
  return (
    <div style={{ background:"#ffffff", fontFamily:"var(--font-sans)", overflow:"hidden" }}>
      {/* Flag-inspired top banner */}
      <div style={{ height:140, background:`linear-gradient(170deg,${v.bg1} 0%,${v.bg1} 52%,${v.accent} 52%)`, position:"relative", overflow:"hidden" }}>
        {/* Giant flag emoji */}
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-60%)", fontSize:70, lineHeight:1, filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.3))" }}>{flag}</div>
        {/* Country name top */}
        <div style={{ position:"absolute", top:14, left:0, right:0, textAlign:"center" }}>
          <span style={{ fontSize:9, fontFamily:"var(--font-mono)", fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(255,255,255,0.7)" }}>{country}</span>
        </div>
        {/* Diagonal overlay for text legibility */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg,rgba(0,0,0,0.15) 0%,transparent 60%)" }} />
      </div>
      {/* White card body */}
      <div style={{ background:"#fff", padding:"0 24px", position:"relative", marginTop:-16 }}>
        <div style={{ background:"#fff", borderRadius:"12px 12px 0 0", padding:"20px 0 0" }}>
          {/* Category */}
          <p style={{ fontSize:9, color:"#aaa", fontFamily:"var(--font-mono)", letterSpacing:"0.15em", textTransform:"uppercase", margin:"0 0 10px" }}>{p.categoryLabel}</p>
          {/* Identity row */}
          <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:16 }}>
            <div style={{ width:68, height:68, borderRadius:14, overflow:"hidden", flexShrink:0, border:"2.5px solid #eee" }}>
              <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
            </div>
            <div>
              <h2 style={{ fontFamily:"var(--font-serif)", fontSize:20, fontWeight:500, color:"#111", margin:"0 0 4px", lineHeight:1.2 }}>{p.fullName}</h2>
              <p style={{ fontSize:11, color:"#666", margin:"0 0 3px", lineHeight:1.45 }}>{p.position}</p>
              <p style={{ fontSize:11, color:v.bg1, fontWeight:700, margin:0 }}>{p.orgShort}</p>
            </div>
          </div>
          {/* Hairline */}
          <div style={{ height:1, background:"#eee", marginBottom:14 }} />
          {/* Contacts */}
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website],[Ic.pin,p.address]].map(([ico,val],i)=>(
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ color:v.bg1, flexShrink:0, marginTop:1 }}>{ico as React.ReactElement}</span>
                <span style={{ fontSize:12, color:"#444", lineHeight:1.5 }}>{val as string}</span>
              </div>
            ))}
          </div>
          {/* Tags */}
          <div style={{ marginTop:14 }}><Tags list={p.tags} bg={`${v.bg1}18`} color={v.bg1} /></div>
          {/* Socials */}
          <div style={{ marginTop:12 }}><Socials s={p.socials} fg="#fff" /></div>
          {/* CTA */}
          <div style={{ marginTop:16, paddingBottom:22 }}>
            <button className="press" style={{ width:"100%", padding:"14px", borderRadius:8, background:v.bg1, border:"none", color:"#fff", fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"var(--font-sans)", letterSpacing:"0.04em" }}>
              Kontaktga qo'shish
            </button>
          </div>
        </div>
      </div>
      <div style={{ background:"#f8f8f8", padding:"8px 24px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:8, fontFamily:"var(--font-mono)", color:"#bbb", letterSpacing:"0.15em" }}>FLEX.COM.UZ · NFC</span>
        <span style={{ color:"#ccc" }}>{Ic.nfc}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: BRAND — full brand color, logo-centric corporate
══════════════════════════════════════════════════════════════════════════════ */
function TplBrand({ p }: { p: Profile }) {
  const v = p.v2!;
  const brandName = p.extra?.brandName ?? p.orgShort;
  const logoChar  = p.extra?.logoChar ?? p.logoText.slice(0,1);
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden" }}>
      {/* Top brand header */}
      <div style={{ background:`linear-gradient(135deg,${v.bg1} 0%,${v.bg2} 100%)`, padding:"28px 24px 24px", position:"relative", overflow:"hidden" }}>
        {/* Background monogram */}
        <div style={{ position:"absolute", right:-20, top:-20, fontSize:160, fontWeight:900, color:"rgba(255,255,255,0.06)", lineHeight:1, userSelect:"none" }}>{logoChar}</div>
        {/* Brand logo circle */}
        <div style={{ width:64, height:64, borderRadius:18, background:"rgba(255,255,255,0.18)", border:"2px solid rgba(255,255,255,0.35)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          <span style={{ fontFamily:"var(--font-sans)", fontWeight:900, fontSize:28, color:v.accent }}>{logoChar}</span>
        </div>
        <p style={{ fontSize:9, fontFamily:"var(--font-mono)", color:v.accent, letterSpacing:"0.2em", textTransform:"uppercase", margin:"0 0 6px", opacity:0.8 }}>{p.categoryLabel}</p>
        <h3 style={{ fontFamily:"var(--font-sans)", fontSize:26, fontWeight:900, color:"#fff", margin:"0 0 4px", letterSpacing:"-0.4px" }}>{brandName}</h3>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", margin:0 }}>{p.position}</p>
      </div>
      {/* White/light body */}
      <div style={{ background:"rgba(255,255,255,0.06)", padding:"20px 24px 0" }}>
        {/* Person row */}
        <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:18, background:"rgba(255,255,255,0.08)", borderRadius:16, padding:14 }}>
          <div style={{ width:54, height:54, borderRadius:12, overflow:"hidden", flexShrink:0, border:"2px solid rgba(255,255,255,0.3)" }}>
            <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:800, color:"#fff", margin:"0 0 3px" }}>{p.fullName}</p>
            <p style={{ fontSize:11, color:v.sub, margin:0 }}>{p.orgShort}</p>
          </div>
          {p.verified && <div style={{ marginLeft:"auto" }}><span style={{ fontSize:9, color:v.accent, fontWeight:800, background:`${v.accent}20`, padding:"4px 10px", borderRadius:20, border:`1px solid ${v.accent}40` }}>✓</span></div>}
        </div>
        {/* Contacts */}
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website]].map(([ico,val],i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color:"rgba(255,255,255,0.6)", flexShrink:0 }}>{ico as React.ReactElement}</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>{val as string}</span>
            </div>
          ))}
        </div>
        {/* Tags */}
        <div style={{ marginTop:14 }}><Tags list={p.tags} bg="rgba(255,255,255,0.12)" color={v.accent} /></div>
        {/* Socials */}
        <div style={{ marginTop:12 }}><Socials s={p.socials} /></div>
        {/* CTA */}
        <div style={{ marginTop:16, paddingBottom:20 }}>
          <button className="press" style={{ width:"100%", padding:"14px", borderRadius:12, background:v.accent, border:"none", color:v.bg1, fontWeight:900, fontSize:12, cursor:"pointer", fontFamily:"var(--font-sans)", letterSpacing:"0.04em" }}>
            KONTAKTGA QO'SHISH
          </button>
        </div>
      </div>
      <NfcFoot color="rgba(255,255,255,0.25)" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: CHEF — dark luxury culinary, warm gold
══════════════════════════════════════════════════════════════════════════════ */
function TplChef({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden" }}>
      {/* Hero photo with warm overlay */}
      <div style={{ position:"relative", height:200, overflow:"hidden" }}>
        <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", filter:"saturate(1.1) brightness(0.75)" }} />
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(180deg,rgba(16,8,6,0.2) 0%,${v.bg1} 100%)` }} />
        {/* Decorative knife-fork icon top right */}
        <div style={{ position:"absolute", top:16, right:16, color:`${v.accent}60`, transform:"rotate(-20deg)" }}>
          {Ic.knife}
        </div>
        {/* Category badge */}
        <div style={{ position:"absolute", top:16, left:16 }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", padding:"4px 12px", borderRadius:3, background:`${v.accent}22`, border:`1px solid ${v.accent}60`, color:v.accent }}>
            {p.categoryLabel}
          </span>
        </div>
      </div>
      {/* Identity */}
      <div style={{ padding:"12px 22px 0", position:"relative" }}>
        {/* Gold ornament */}
        <div style={{ color:`${v.accent}50`, fontSize:16, letterSpacing:"0.5em", marginBottom:10 }}>✦ ✦ ✦</div>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:24, fontWeight:400, color:v.text, margin:"0 0 5px", lineHeight:1.2 }}>{p.fullName}</h2>
        <p style={{ fontSize:12, color:v.sub, margin:"0 0 4px" }}>{p.position}</p>
        <p style={{ fontSize:11, color:v.accent, fontWeight:600, margin:0 }}>{p.orgShort}</p>
        {p.verified && <div style={{ marginTop:8 }}><VerBadge accent={v.accent} bg={v.bg2} text={v.text} /></div>}
      </div>
      {/* Gold divider */}
      <div style={{ margin:"16px 22px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:`${v.accent}30` }} />
        <span style={{ color:`${v.accent}80`, fontSize:10 }}>✦</span>
        <div style={{ flex:1, height:1, background:`${v.accent}30` }} />
      </div>
      {/* Contacts */}
      <div style={{ padding:"0 22px", display:"flex", flexDirection:"column", gap:8 }}>
        {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website],[Ic.pin,p.address]].map(([ico,val],i)=>(
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <span style={{ color:v.accent, opacity:0.7, flexShrink:0, marginTop:1 }}>{ico as React.ReactElement}</span>
            <span style={{ fontSize:12, color:v.sub, lineHeight:1.5 }}>{val as string}</span>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"14px 22px 0" }}><Tags list={p.tags} bg={v.tag} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 22px" }}><Socials s={p.socials} /></div>
      {/* CTA */}
      <div style={{ padding:"0 22px 22px" }}>
        <button className="press" style={{ width:"100%", padding:"14px", borderRadius:4, background:`${v.accent}15`, border:`1px solid ${v.accent}60`, color:v.accent, fontWeight:700, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", fontFamily:"var(--font-serif)" }}>
          Kontaktga qo'shish
        </button>
      </div>
      <NfcFoot color={`${v.accent}35`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: ARTIST — white canvas, paint splashes, polaroid
══════════════════════════════════════════════════════════════════════════════ */
function TplArtist({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden", position:"relative" }}>
      {/* Paint blobs background */}
      <div style={{ position:"absolute", inset:0, backgroundImage:PAT.paintDots, backgroundSize:"200px 200px", pointerEvents:"none" }} />
      {/* Polaroid photo */}
      <div style={{ display:"flex", justifyContent:"center", padding:"28px 20px 0", position:"relative" }}>
        <div style={{ background:"#fff", padding:"10px 10px 40px", boxShadow:"0 8px 32px rgba(0,0,0,0.15),0 2px 8px rgba(0,0,0,0.08)", transform:"rotate(-2deg)", borderRadius:3 }}>
          <div style={{ width:200, height:200, overflow:"hidden" }}>
            <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
          </div>
          <div style={{ padding:"8px 4px 0", textAlign:"center" }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#333", margin:0, letterSpacing:"0.05em" }}>{p.fullName}</p>
          </div>
        </div>
      </div>
      {/* Identity below polaroid */}
      <div style={{ textAlign:"center", padding:"20px 24px 0", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center", marginBottom:8 }}>
          <span style={{ color:v.accent }}>{Ic.palette}</span>
          <p style={{ fontSize:10, color:v.accent, fontWeight:800, margin:0, letterSpacing:"0.14em", textTransform:"uppercase" }}>{p.categoryLabel}</p>
        </div>
        <p style={{ fontSize:12, color:v.sub, margin:"0 0 4px", lineHeight:1.5 }}>{p.position}</p>
        {p.extra?.specialty && <p style={{ fontSize:11, color:`${v.accent}aa`, fontWeight:600, margin:0, fontStyle:"italic" }}>{p.extra.specialty}</p>}
      </div>
      {/* Color swatches as tags */}
      <div style={{ display:"flex", justifyContent:"center", padding:"12px 20px 0", gap:6, flexWrap:"wrap" }}>
        {["#e63462","#3b82f6","#10b981","#f59e0b","#8b5cf6"].map((c,i)=>(
          <div key={i} style={{ width:22, height:22, borderRadius:"50%", background:c, border:"2px solid #fff", boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }} />
        ))}
      </div>
      {/* Contacts */}
      <div style={{ padding:"16px 24px 0", display:"flex", flexDirection:"column", gap:8 }}>
        {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website]].map(([ico,val],i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderRadius:10, background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.06)" }}>
            <span style={{ color:v.accent }}>{ico as React.ReactElement}</span>
            <span style={{ fontSize:12, color:v.sub }}>{val as string}</span>
          </div>
        ))}
      </div>
      {/* Tags */}
      <div style={{ padding:"12px 24px 0" }}><Tags list={p.tags} bg={v.tag} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 24px" }}><Socials s={p.socials} fg={v.text} /></div>
      {/* CTA */}
      <div style={{ padding:"0 24px 24px" }}>
        <button className="press" style={{ width:"100%", padding:"14px", borderRadius:10, background:v.accent, border:"none", color:"#fff", fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"var(--font-sans)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {Ic.palette} Kontaktga qo'shish
        </button>
      </div>
      <NfcFoot color={`${v.accent}40`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 TEMPLATE: MUSICIAN — concert poster, neon purple, equalizer
══════════════════════════════════════════════════════════════════════════════ */
function TplMusician({ p }: { p: Profile }) {
  const v = p.v2!;
  return (
    <div style={{ background:v.bg1, fontFamily:"var(--font-sans)", overflow:"hidden", position:"relative" }}>
      {/* Music bars pattern */}
      <div style={{ position:"absolute", inset:0, backgroundImage:PAT.music, backgroundSize:"60px 60px", pointerEvents:"none" }} />
      {/* Neon glow blob */}
      <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:300, height:200, background:`radial-gradient(ellipse,${v.accent}25 0%,transparent 70%)`, pointerEvents:"none" }} />
      {/* Concert poster header */}
      <div style={{ padding:"28px 22px 0", position:"relative" }}>
        <p style={{ fontSize:9, fontFamily:"var(--font-mono)", color:v.accent, letterSpacing:"0.25em", textTransform:"uppercase", margin:"0 0 10px", opacity:0.8 }}>{p.categoryLabel}</p>
        <h2 style={{ fontFamily:"var(--font-sans)", fontSize:36, fontWeight:900, color:"#fff", margin:"0 0 0", lineHeight:1, letterSpacing:"-1px", textTransform:"uppercase", textShadow:`0 0 40px ${v.accent}80` }}>
          {p.fullName.split(" ")[0]}
        </h2>
        <h2 style={{ fontFamily:"var(--font-sans)", fontSize:36, fontWeight:900, color:v.accent, margin:"0 0 6px", lineHeight:1, letterSpacing:"-1px", textTransform:"uppercase", textShadow:`0 0 40px ${v.accent}` }}>
          {p.fullName.split(" ").slice(1).join(" ")}
        </h2>
        <p style={{ fontSize:12, color:v.sub, margin:"0 0 4px" }}>{p.position}</p>
        {p.extra?.specialty && <p style={{ fontSize:11, color:v.accent, fontWeight:700, margin:0 }}>{p.extra.specialty}</p>}
      </div>
      {/* Equalizer bars animated */}
      <div style={{ padding:"20px 22px 0", display:"flex", gap:4, alignItems:"flex-end", height:56 }}>
        {[35,55,42,70,28,60,45,72,38,50,65,30,55,45,62].map((h,i)=>(
          <div key={i} style={{ flex:1, borderRadius:"2px 2px 0 0", background:`${v.accent}${i%2===0?"cc":"66"}`, height:`${h}%`, animation:`equalizer ${0.8+i*0.1}s ease-in-out infinite alternate` }} />
        ))}
      </div>
      {/* Avatar row */}
      <div style={{ display:"flex", gap:16, alignItems:"center", padding:"20px 22px 0" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", overflow:"hidden", flexShrink:0, border:`2px solid ${v.accent}80`, boxShadow:`0 0 20px ${v.accent}50` }}>
          <img src={p.avatar} alt={p.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
          {[[Ic.phone,p.phone],[Ic.mail,p.email],[Ic.web,p.website]].map(([ico,val],i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:`${v.accent}80`, flexShrink:0 }}>{ico as React.ReactElement}</span>
              <span style={{ fontSize:11, color:v.sub, fontFamily:"var(--font-mono)" }}>{val as string}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Tags */}
      <div style={{ padding:"14px 22px 0" }}><Tags list={p.tags} bg={v.tag} color={v.accent} /></div>
      {/* Socials */}
      <div style={{ padding:"12px 22px" }}><Socials s={p.socials} /></div>
      {/* CTA */}
      <div style={{ padding:"0 22px 22px" }}>
        <button className="press" style={{ width:"100%", padding:"14px", borderRadius:10, background:`${v.accent}`, border:"none", color:v.bg1, fontWeight:900, fontSize:12, cursor:"pointer", fontFamily:"var(--font-sans)", letterSpacing:"0.04em", boxShadow:`0 0 24px ${v.accent}70` }}>
          KONTAKTGA QO'SHISH
        </button>
      </div>
      <NfcFoot color={`${v.accent}45`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 ROUTER
══════════════════════════════════════════════════════════════════════════════ */
interface Props { profile: Profile }
export default function ProfileCardV2({ profile: p }: Props) {
  switch (p.template) {
    case "premium":    return <TplPremium    p={p} />;
    case "gradient":   return <TplGradient   p={p} />;
    case "minimal":    return <TplMinimal    p={p} />;
    case "glass":      return <TplGlass      p={p} />;
    case "stripe":     return <TplStripe     p={p} />;
    case "feminine":   return <TplFeminine   p={p} />;
    case "terminal":   return <TplTerminal   p={p} />;
    case "comic":      return <TplComic      p={p} />;
    case "sport":      return <TplSport      p={p} />;
    case "kids":       return <TplKids       p={p} />;
    case "nature":     return <TplNature     p={p} />;
    case "historical": return <TplHistorical p={p} />;
    case "country":    return <TplCountry    p={p} />;
    case "brand":      return <TplBrand      p={p} />;
    case "chef":       return <TplChef       p={p} />;
    case "artist":     return <TplArtist     p={p} />;
    case "musician":   return <TplMusician   p={p} />;
    default:           return <TplMinimal    p={p} />;
  }
}
