#!/usr/bin/env node
// Writes the Flex mark to the files a browser and a phone ask for by name.
//
// The share card is not here: it is drawn by `opengraph-image.tsx` from the
// site's own tokens, so it can carry type and change with the site. What is
// left is the set that has to be a file at a fixed address — a manifest icon,
// an apple-touch-icon, a favicon — and none of those can be generated per
// request because the things that fetch them do not run our JavaScript.
//
// Usage: npm run icons

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

import { render } from "./mark-raster.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(root, "public");
// Next emits <link rel="apple-touch-icon"> only for an icon that follows the
// app-directory file convention; one sitting in public/ is never linked, and
// iOS then screenshots the page instead of using the mark.
const APP_DIR = join(root, "src", "app");

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
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // One filter byte (0 = none) in front of every scanline.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.buffer, y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// An .ico is a container: a small header, one directory entry per size, then
// the images. The images may themselves be PNG, which every browser shipped
// since about 2011 reads, and which keeps this to a few hundred bytes a size
// rather than an uncompressed bitmap each.
//
// Written rather than kept, because the file this replaces was the Next starter
// mark that arrived with `create-next-app` — and Google puts the favicon beside
// the result on a phone, so the tab is not the only place it is seen.
function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;

  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    // 0 means 256 here; the field is one byte and 256 does not fit in it.
    entry[0] = size === 256 ? 0 : size;
    entry[1] = size === 256 ? 0 : size;
    entry[2] = 0; // palette size: none, it is truecolour
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

const ICONS = [
  { file: "icon-192.png", size: 192, mark: 0.74, cornerRadius: 0.22 },
  { file: "icon-512.png", size: 512, mark: 0.74, cornerRadius: 0.22 },
  // Some launchers crop a maskable icon to a circle, so this one bleeds to the
  // edges and the glyph is pulled further in, inside the 80% safe zone.
  { file: "icon-maskable-512.png", size: 512, mark: 0.6, cornerRadius: 0 },
  // iOS rounds its own corners, so a corner rounded here is rounded twice.
  { file: "apple-icon.png", size: 180, mark: 0.74, cornerRadius: 0, app: true },
];

for (const icon of ICONS) {
  const png = encodePng(render(icon.size, icon), icon.size);
  writeFileSync(join(icon.app ? APP_DIR : PUBLIC_DIR, icon.file), png);
  const where = icon.app ? "src/app" : "public";
  console.log(`${where}/${icon.file}`.padEnd(34) + `${png.length} bayt`);
}

// Small sizes get a fatter glyph: at sixteen pixels the mark has to be legible
// rather than faithful, and two pixels of rounded corner are two pixels of
// nothing.
const ICO_SIZES = [
  { size: 16, mark: 0.92, cornerRadius: 0.16 },
  { size: 32, mark: 0.86, cornerRadius: 0.2 },
  { size: 48, mark: 0.82, cornerRadius: 0.22 },
  { size: 180, mark: 0.74, cornerRadius: 0.22 },
];

const ico = encodeIco(
  ICO_SIZES.map((icon) => ({
    size: icon.size,
    png: encodePng(render(icon.size, icon), icon.size),
  })),
);
writeFileSync(join(APP_DIR, "favicon.ico"), ico);
console.log("src/app/favicon.ico".padEnd(34) + `${ico.length} bayt`);
