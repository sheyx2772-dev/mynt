#!/usr/bin/env node
// Renders the Flex mark to PNG for the web app manifest, the home screen and
// the Telegram bot.
//
// The mark is a point with the signal leaving it — the contactless symbol, in
// the brand's ink and lime. Simple enough to rasterise directly, which keeps an
// image-processing dependency out of the tree for five files that change
// approximately never.
//
// The geometry is the same numbers as src/components/Mark.tsx, which draws it
// as SVG for the page. They are stated in both because this file must not
// import from the app, and a comment in each points at the other: if one moves,
// the other has to.
//
// Usage: npm run icons

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(root, "public");
// Next emits <link rel="apple-touch-icon"> only for an icon that follows the
// app-directory file convention; one sitting in public/ is never linked, and
// iOS then screenshots the page instead of using the mark.
const APP_DIR = join(root, "src", "app");

const INK = [0x0e, 0x0a, 0x1b];
const LIME = [0xab, 0xff, 0x09];

// Edges are drawn at 4x and averaged down, which is cheaper to write than a
// coverage-based rasteriser and indistinguishable at these sizes.
const SS = 4;

function insideRoundedRect(x, y, size, radius) {
  const r = radius;
  const cx = Math.min(Math.max(x, r), size - r);
  const cy = Math.min(Math.max(y, r), size - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function insideCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// A segment of a ring with round caps: within the stroke of the radius and
// inside the sweep, or within the stroke of either end point.
function nearArc(px, py, cx, cy, radius, halfSweep, halfWidth) {
  const dx = px - cx;
  const dy = py - cy;

  if (Math.abs(Math.hypot(dx, dy) - radius) <= halfWidth) {
    const angle = Math.atan2(dy, dx);
    if (angle >= -halfSweep && angle <= halfSweep) return true;
  }

  for (const a of [-halfSweep, halfSweep]) {
    const ex = px - (cx + Math.cos(a) * radius);
    const ey = py - (cy + Math.sin(a) * radius);
    if (ex * ex + ey * ey <= halfWidth * halfWidth) return true;
  }

  return false;
}

// Mirrors MARK in src/components/Mark.tsx. Fractions of a 100-unit box.
const MARK = {
  originX: 27,
  originY: 50,
  dotRadius: 10,
  arcRadii: [26, 45],
  arcStroke: 11,
  arcHalfSweep: 0.88,
};

/** True where the mark's lime falls, for a box of `S` units at `scale`. */
function insideMark(px, py, S, scale) {
  const u = (S / 100) * scale;
  const offset = (S - S * scale) / 2;
  const x = (px - offset) / scale;
  const y = (py - offset) / scale;
  const s = S / 100;

  if (insideCircle(x, y, MARK.originX * s, MARK.originY * s, MARK.dotRadius * s)) return true;
  for (const r of MARK.arcRadii) {
    if (
      nearArc(x, y, MARK.originX * s, MARK.originY * s, r * s, MARK.arcHalfSweep, (MARK.arcStroke * s) / 2)
    ) {
      return true;
    }
  }
  void u;
  return false;
}

// `padding` is a fraction of the icon's edge; `mark` scales the glyph inside it.
function render(size, { padding, mark, cornerRadius }) {
  const S = size * SS;
  const pad = padding * S;
  const boxSize = S - pad * 2;
  const radius = cornerRadius * boxSize;

  const pixels = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x * SS + sx + 0.5;
          const py = y * SS + sy + 0.5;

          if (insideMark(px, py, S, mark)) {
            r += LIME[0]; g += LIME[1]; b += LIME[2]; a += 255;
          } else if (insideRoundedRect(px - pad, py - pad, boxSize, radius)) {
            r += INK[0]; g += INK[1]; b += INK[2]; a += 255;
          }
        }
      }

      const n = SS * SS;
      const i = (y * size + x) * 4;
      // Premultiplied averaging would darken the edge against a light
      // background, so divide the colour by covered samples, not by all.
      const covered = a / 255;
      pixels[i] = covered ? Math.round(r / covered) : 0;
      pixels[i + 1] = covered ? Math.round(g / covered) : 0;
      pixels[i + 2] = covered ? Math.round(b / covered) : 0;
      pixels[i + 3] = Math.round(a / n);
    }
  }

  return pixels;
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(pixels, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type: RGBA
  ihdr[10] = 0;  // deflate
  ihdr[11] = 0;  // adaptive filtering
  ihdr[12] = 0;  // no interlace

  // One filter byte (0 = none) in front of every scanline.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// A maskable icon is cropped to a circle by some launchers, so it bleeds to
// the edges and keeps the dot well inside the 80% safe zone.
const ICONS = [
  { file: "icon-192.png", size: 192, padding: 0, mark: 0.74, cornerRadius: 0.22 },
  { file: "icon-512.png", size: 512, padding: 0, mark: 0.74, cornerRadius: 0.22 },
  // Some launchers crop a maskable icon to a circle, so the glyph is pulled
  // further in to stay inside the 80% safe zone.
  { file: "icon-maskable-512.png", size: 512, padding: 0, mark: 0.6, cornerRadius: 0 },
  // iOS applies its own rounding, so this one is a plain square.
  { file: "apple-icon.png", size: 180, padding: 0, mark: 0.74, cornerRadius: 0, dir: "app" },
  // Telegram crops an avatar to a circle and shows it at about forty pixels in
  // a chat list. The corners of the rounded square are cut away there, so this
  // one is a full-bleed square — nothing is lost that was drawn — and the dot
  // is larger, because at that size the mark has to be legible rather than
  // faithful. Square rather than pre-rounded: Telegram does its own masking,
  // and a transparent corner underneath it renders as white.
  { file: "telegram-avatar.png", size: 512, padding: 0, mark: 0.72, cornerRadius: 0 },
];

mkdirSync(PUBLIC_DIR, { recursive: true });

for (const icon of ICONS) {
  const pixels = render(icon.size, icon);
  const png = encodePng(pixels, icon.size);
  const dir = icon.dir === "app" ? APP_DIR : PUBLIC_DIR;
  writeFileSync(join(dir, icon.file), png);
  const where = icon.dir === "app" ? "src/app" : "public";
  console.log(`${where}/${icon.file}`.padEnd(34) + `${icon.size}x${icon.size}  ${png.length} bytes`);
}
