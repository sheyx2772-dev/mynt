#!/usr/bin/env node
// Renders the HTML deck to one PNG per slide, at print resolution.
//
// The slides are designed in CSS because that is where the brand already lives —
// its faces, its lime, its rounded corners and the photography. This turns each
// of those sections into an image the presentation file can carry, so the deck
// looks the same on a projector in a hall as it does here, with no font to be
// missing and no version of PowerPoint to disagree with.
//
// Usage: node scripts/deck-render.mjs uz

import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const lang = process.argv[2] ?? "uz";
  const out = join(root, "deck", `render-${lang}`);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  const browser = await chromium.launch();
  // Three times, so the finished slide is 3840 across: a projector, a laptop
  // and a printer all get more pixels than they can use.
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 3,
  });

  await page.goto(`file://${join(root, "deck", `slides-${lang}.html`)}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });

  // The webfonts arrive over the network; a screenshot taken before they land
  // is a deck set in the fallback.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  const slides = await page.$$("section.slide");
  for (const [i, slide] of slides.entries()) {
    await slide.screenshot({ path: join(out, `${String(i + 1).padStart(2, "0")}.png`) });
  }

  await browser.close();
  console.log(`  ${slides.length} slides → deck/render-${lang}/`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
