#!/usr/bin/env node
// Renders the Mynt mark to PNG for the web app manifest.
//
// The mark is a rounded square in the brand ink with a lime dot — simple
// enough to rasterise directly, which keeps an image-processing dependency
// out of the tree for four files that change approximately never.
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

// `padding` and `dot` are fractions of the icon's edge.
function render(size, { padding, dot, cornerRadius }) {
  const S = size * SS;
  const pad = padding * S;
  const boxSize = S - pad * 2;
  const radius = cornerRadius * boxSize;
  const dotRadius = (dot * S) / 2;
  const centre = S / 2;

  const pixels = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x * SS + sx + 0.5;
          const py = y * SS + sy + 0.5;

          if (insideCircle(px, py, centre, centre, dotRadius)) {
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
  { file: "icon-192.png", size: 192, padding: 0, dot: 0.3, cornerRadius: 0.22 },
  { file: "icon-512.png", size: 512, padding: 0, dot: 0.3, cornerRadius: 0.22 },
  { file: "icon-maskable-512.png", size: 512, padding: 0, dot: 0.24, cornerRadius: 0 },
  // iOS applies its own rounding, so this one is a plain square.
  { file: "apple-icon.png", size: 180, padding: 0, dot: 0.3, cornerRadius: 0, dir: "app" },
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
