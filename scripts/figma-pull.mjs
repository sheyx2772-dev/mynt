#!/usr/bin/env node
// Pull the real numbers out of a Figma file instead of eyeballing a screenshot.
//
//   FIGMA_TOKEN=figd_... node scripts/figma-pull.mjs <file-url|file-key> [node-id]
//
// Writes to figma/: the raw document, a readable report of every colour, type
// style, radius and shadow the file actually uses, a CSS block ready for the
// @theme in globals.css, and every icon/logo as SVG.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TOKEN = process.env.FIGMA_TOKEN;
const [target, nodeArg] = process.argv.slice(2);
const OUT = "figma";

if (!TOKEN || !target) {
  console.error(`
Foydalanish:
  FIGMA_TOKEN=figd_xxx node scripts/figma-pull.mjs <figma-havola> [node-id]

Token: figma.com -> Settings -> Security -> Personal access tokens.
Ruxsat: "File content: Read-only" yetarli.
`);
  process.exit(1);
}

// figma.com/design/KEY/Name?node-id=12-34  ->  KEY, "12:34"
const key = target.match(/(?:file|design)\/([A-Za-z0-9]+)/)?.[1] ?? target;
const nodeId = (nodeArg ?? target.match(/node-id=([0-9%3A-]+)/)?.[1] ?? "")
  .replace(/%3A/gi, ":")
  .replace("-", ":");

const api = async (path) => {
  const res = await fetch(`https://api.figma.com/v1/${path}`, {
    headers: { "X-Figma-Token": TOKEN },
  });
  if (!res.ok) throw new Error(`Figma ${res.status} ${res.statusText} — ${path}`);
  return res.json();
};

const hex = (c, opacity = 1) => {
  const b = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  const a = (c.a ?? 1) * opacity;
  return `#${b(c.r)}${b(c.g)}${b(c.b)}${a < 0.999 ? b(a) : ""}`;
};

const colours = new Map();   // hex -> {count, where:Set}
const texts = new Map();     // signature -> {count, where:Set, style}
const radii = new Map();     // px -> count
const shadows = new Map();   // signature -> {count, where:Set}
const frames = [];           // top-level frame geometry
const exportable = [];       // icons and logos worth pulling as SVG

const note = (map, k, where) => {
  const e = map.get(k) ?? { count: 0, where: new Set() };
  e.count += 1;
  if (where && e.where.size < 6) e.where.add(where);
  map.set(k, e);
};

function walk(node, path = [], depth = 0) {
  const here = [...path, node.name].filter(Boolean).join(" / ");

  for (const fill of node.fills ?? []) {
    if (fill.visible === false) continue;
    if (fill.type === "SOLID") note(colours, hex(fill.color, fill.opacity), here);
    if (fill.type?.startsWith("GRADIENT")) {
      note(colours, `gradient(${fill.gradientStops.map((s) => hex(s.color)).join(" -> ")})`, here);
    }
  }
  for (const stroke of node.strokes ?? []) {
    if (stroke.type === "SOLID") note(colours, `${hex(stroke.color, stroke.opacity)} (chiziq ${node.strokeWeight ?? 1}px)`, here);
  }

  if (node.style?.fontSize) {
    const s = node.style;
    const sig = [
      s.fontFamily,
      `${s.fontWeight}`,
      `${s.fontSize}px`,
      `/${Math.round(s.lineHeightPx ?? s.fontSize)}px`,
      s.letterSpacing ? `${s.letterSpacing.toFixed(2)}px` : "0",
      s.textCase ?? "",
    ].join(" · ");
    const e = texts.get(sig) ?? { count: 0, where: new Set(), style: s };
    e.count += 1;
    if (e.where.size < 6) e.where.add(here);
    texts.set(sig, e);
  }

  const r = node.cornerRadius ?? node.rectangleCornerRadii?.[0];
  if (typeof r === "number" && r > 0) radii.set(r, (radii.get(r) ?? 0) + 1);

  for (const fx of node.effects ?? []) {
    if (fx.visible === false) continue;
    if (fx.type === "DROP_SHADOW" || fx.type === "INNER_SHADOW") {
      const inset = fx.type === "INNER_SHADOW" ? "inset " : "";
      note(shadows, `${inset}${fx.offset.x}px ${fx.offset.y}px ${fx.radius}px ${fx.spread ?? 0}px ${hex(fx.color)}`, here);
    }
  }

  if (depth <= 2 && node.absoluteBoundingBox && /FRAME|COMPONENT/.test(node.type)) {
    const b = node.absoluteBoundingBox;
    frames.push({
      name: here,
      w: Math.round(b.width),
      h: Math.round(b.height),
      layout: node.layoutMode ?? "—",
      gap: node.itemSpacing ?? null,
      pad: node.layoutMode
        ? `${node.paddingTop ?? 0} ${node.paddingRight ?? 0} ${node.paddingBottom ?? 0} ${node.paddingLeft ?? 0}`
        : null,
    });
  }

  if (/icon|logo|emblem|gerb|mark|belgi|nishon/i.test(node.name) && node.id !== nodeId) {
    if (exportable.length < 60) exportable.push({ id: node.id, name: node.name });
  }

  for (const child of node.children ?? []) walk(child, [...path, node.name], depth + 1);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

console.log(`Fayl: ${key}${nodeId ? `  tugun: ${nodeId}` : ""}`);
const doc = nodeId
  ? Object.values((await api(`files/${key}/nodes?ids=${encodeURIComponent(nodeId)}`)).nodes)[0].document
  : (await api(`files/${key}`)).document;

walk(doc);
await mkdir(join(OUT, "assets"), { recursive: true });
await writeFile(join(OUT, "document.json"), JSON.stringify(doc, null, 2));

const by = (m) => [...m.entries()].sort((a, b) => (b[1].count ?? b[1]) - (a[1].count ?? a[1]));

let md = `# Figma'dan olingan qiymatlar\n\nFayl: \`${key}\`${nodeId ? `, tugun \`${nodeId}\`` : ""}\nOlingan: ${new Date().toISOString().slice(0, 10)}\n\n`;

md += `## Ranglar (${colours.size} ta)\n\nHar bir rang nechta joyda ishlatilgan — eng ko'pi yuqorida.\n\n| Rang | Necha marta | Qayerda |\n|---|---|---|\n`;
for (const [c, e] of by(colours)) md += `| \`${c}\` | ${e.count} | ${[...e.where].join("; ")} |\n`;

md += `\n## Matn uslublari (${texts.size} ta)\n\n| Shrift · og'irlik · o'lcham / qator · harf oralig'i | Necha marta | Qayerda |\n|---|---|---|\n`;
for (const [s, e] of by(texts)) md += `| ${s} | ${e.count} | ${[...e.where].join("; ")} |\n`;

md += `\n## Burchak radiuslari\n\n${[...radii.entries()].sort((a, b) => a[0] - b[0]).map(([r, n]) => `- \`${r}px\` — ${n} ta`).join("\n") || "yo'q"}\n`;

md += `\n## Soyalar\n\n${by(shadows).map(([s, e]) => `- \`${s}\` — ${e.count} ta (${[...e.where][0]})`).join("\n") || "yo'q"}\n`;

md += `\n## Freymlar va auto-layout\n\n| Nomi | O'lcham | Layout | Gap | Padding |\n|---|---|---|---|---|\n`;
for (const f of frames) md += `| ${f.name} | ${f.w}×${f.h} | ${f.layout} | ${f.gap ?? "—"} | ${f.pad ?? "—"} |\n`;

await writeFile(join(OUT, "tokens.md"), md);

// A @theme block is the only part of a Figma file that transfers unchanged.
let css = `/* Figma ${key} — ${new Date().toISOString().slice(0, 10)}\n   globals.css ichidagi @theme ga ko'chiring. Nomlarni o'zingiz bering. */\n@theme {\n`;
by(colours)
  .filter(([c]) => c.startsWith("#"))
  .slice(0, 24)
  .forEach(([c, e], i) => {
    css += `  --color-figma-${i + 1}: ${c}; /* ${e.count}× — ${[...e.where][0] ?? ""} */\n`;
  });
by(shadows).slice(0, 8).forEach(([s], i) => {
  css += `  --shadow-figma-${i + 1}: ${s};\n`;
});
css += "}\n";
await writeFile(join(OUT, "tokens.css"), css);

if (exportable.length) {
  const ids = exportable.map((e) => e.id).join(",");
  const { images } = await api(`images/${key}?ids=${encodeURIComponent(ids)}&format=svg`);
  let saved = 0;
  for (const { id, name } of exportable) {
    const url = images[id];
    if (!url) continue;
    const svg = await (await fetch(url)).text();
    await writeFile(join(OUT, "assets", `${slug(name)}-${id.replace(/\W/g, "")}.svg`), svg);
    saved += 1;
  }
  console.log(`SVG: ${saved} ta -> ${OUT}/assets/`);
}

console.log(`Ranglar ${colours.size}, matn uslublari ${texts.size}, radius ${radii.size}, soya ${shadows.size}`);
console.log(`Yozildi: ${OUT}/tokens.md, ${OUT}/tokens.css, ${OUT}/document.json`);
