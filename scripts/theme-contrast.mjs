// Checks every theme's text against the ground it is actually drawn on.
//
// Written because "it looks fine" is not a measurement, and a theme catalogue
// is exactly where an unreadable one slips in: eight palettes, each judged by
// eye on a good monitor, one of them 3.9:1 and illegible in the sun on the
// phone this product is actually read on.
//
// Run: node scripts/theme-contrast.mjs

import { readFileSync } from "node:fs";

/** WCAG relative luminance. */
function luminance(hex) {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/../g)
    .map((h) => {
      const c = parseInt(h, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

// Every [data-theme="…"] block, and the six values inside it.
const themes = [...css.matchAll(/\[data-theme="([a-z-]+)"\]\s*\{([^}]+)\}/g)].map(
  ([, name, body]) => {
    const token = (n) =>
      (body.match(new RegExp(`--(?:color|card)-${n}:\\s*(#[0-9a-fA-F]{6})`)) ?? [])[1];
    return {
      name,
      paper: token("paper"),
      sheet: token("sheet"),
      ink: token("ink"),
      mute: token("mute"),
      accent: token("lime"),
      gold: token("gold"),
      // A theme whose page is darker than its sheet says so with these; the
      // rest inherit the sheet's ink and never mention them.
      pageInk: token("page-ink") ?? token("ink"),
      pageMute: token("page-mute") ?? token("mute"),
      // What is cut into the card, and the colour it is cut into. These were
      // once one token doing two jobs, and a bone-white card ended up with a
      // gold engraving on it — gold on cream, which is nothing at all.
      engraved: token("engraved") ?? token("gold"),
      cardBase: token("base"),
      slab: token("slab") ?? token("ink"),
      onSlab: token("on-slab") ?? token("sheet"),
      onAccent: token("on-accent") ?? token("ink"),
    };
  },
);

if (themes.length === 0) {
  console.error("No themes found in globals.css.");
  process.exit(1);
}

// What is actually drawn where. Body text has to clear 4.5; the accent is only
// ever a surface with ink on top, so it is checked that way round.
const CHECKS = [
  ["ink on sheet", (t) => [t.ink, t.sheet], 4.5],
  ["page ink on paper", (t) => [t.pageInk, t.paper], 4.5],
  ["mute on sheet", (t) => [t.mute, t.sheet], 4.5],
  ["page mute on paper", (t) => [t.pageMute, t.paper], 4.5],
  ["text on accent", (t) => [t.onAccent, t.accent], 4.5],
  // The plate, the solid buttons and the avatar are ink surfaces with light
  // text on them. That text used to be `paper`, which is the page — fine until
  // a theme made the page dark and put dark text on a dark plate.
  ["text on slab", (t) => [t.onSlab, t.slab], 4.5],
  // The engraving is large and wide-tracked, so it is held to the large-text
  // bar rather than the body one.
  ["plate edge on slab", (t) => [t.gold, t.slab], 3],
  ["engraving on card", (t) => [t.engraved, t.cardBase], 3],
];

let failed = 0;
for (const t of themes) {
  const rows = CHECKS.map(([label, pick, min]) => {
    const [fg, bg] = pick(t);
    if (!fg || !bg) return { label, r: null, min, ok: false };
    const r = ratio(fg, bg);
    return { label, r, min, ok: r >= min };
  });
  const bad = rows.filter((r) => !r.ok);
  failed += bad.length;
  console.log(`\n${t.name}${bad.length ? "  ✗" : "  ✓"}`);
  for (const r of rows) {
    const shown = r.r === null ? "  —  " : r.r.toFixed(2).padStart(5);
    console.log(`  ${r.ok ? " " : "✗"} ${r.label.padEnd(16)} ${shown}  (min ${r.min})`);
  }
}

console.log(
  failed === 0
    ? `\n${themes.length} themes, every pair clears its bar.`
    : `\n${failed} pair${failed === 1 ? "" : "s"} below the bar.`,
);
process.exit(failed === 0 ? 0 : 1);
