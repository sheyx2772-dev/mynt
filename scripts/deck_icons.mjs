#!/usr/bin/env node
// Rasterises the deck's line icons to transparent PNGs.
//
// PowerPoint takes SVG, python-pptx does not put it in reliably, and the deck
// is now a real editable presentation rather than a stack of screenshots — so
// each icon becomes a small picture the file can carry on its own. Two colours,
// because half the slides are ink on paper and half are lime on ink.
//
// Usage: node scripts/deck_icons.mjs

import { readdir, readFile, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "deck", "icons");
const OUT = join(root, "deck", "icons-png");

// Rendered at 192 so an icon set 30pt wide on a slide still has more pixels
// than a projector can show.
const SIZE = 192;
const COLOURS = { lime: "#ABFF09", ink: "#0E0A1B", paper: "#FAFAF8", olive: "#4D7C0F" };

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: SIZE, height: SIZE },
    deviceScaleFactor: 1,
  });

  const names = (await readdir(SRC)).filter((f) => f.endsWith(".svg"));
  for (const file of names) {
    const svg = await readFile(join(SRC, file), "utf8");
    for (const [tone, hex] of Object.entries(COLOURS)) {
      const painted = svg
        .replace('stroke="currentColor"', `stroke="${hex}"`)
        .replace('width="24"', `width="${SIZE}"`)
        .replace('height="24"', `height="${SIZE}"`)
        .replace('stroke-width="2"', 'stroke-width="1.7"');

      await page.setContent(
        `<style>html,body{margin:0;background:transparent}</style>${painted}`,
      );
      await page.screenshot({
        path: join(OUT, `${file.replace(".svg", "")}-${tone}.png`),
        omitBackground: true,
      });
    }
  }

  await browser.close();
  console.log(`  ${names.length} icons × ${Object.keys(COLOURS).length} tones → deck/icons-png/`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
