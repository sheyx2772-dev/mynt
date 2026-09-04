#!/usr/bin/env node
// Takes the product screenshots that go into the pitch deck.
//
// Real screens rather than mock-ups: a deck that shows a drawing of an app is
// asking an investor to believe something, and a deck that shows the app is
// showing them. Every shot here comes from the running product against the
// real database.
//
// Usage: node scripts/deck-shots.mjs [base-url]

import { readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "deck", "shots");

const PHONE = { width: 390, height: 844, deviceScaleFactor: 3 };

async function loadEnv() {
  const env = { ...process.env };
  const raw = await readFile(join(root, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function main() {
  const base = process.argv[2] ?? "http://localhost:52402";
  const env = await loadEnv();
  await mkdir(OUT, { recursive: true });

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // The counter screen is behind a secret link, and the cabinet behind a
  // session. Both are the point of the product, so both are fetched properly
  // rather than skipped.
  const { data: venue } = await admin.from("venues").select("staff_token").limit(1).single();

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 3 });
  const page = await context.newPage();

  const shots = [
    ["menu", `${base}/NAV001?stol=7`],
    ["counter", `${base}/z/${venue.staff_token}`],
    ["profile", `${base}/MYN042`],
    ["home", `${base}/`],
  ];

  for (const [name, url] of shots) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    // The request bar and the strips settle a beat after the network does.
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    console.log(`  ${name.padEnd(10)} ${url}`);
  }

  // Signed in, for the screens an owner sees.
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: "sinov-kafe@flex.local",
  });

  await page.goto(
    `${base}/auth/confirm?token_hash=${link.properties.hashed_token}&type=magiclink&keyin=/kabinet`,
    { waitUntil: "networkidle", timeout: 60_000 },
  );
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(OUT, "cabinet.png") });
  console.log("  cabinet    /kabinet");

  await page.goto(`${base}/kabinet/NAV001/hisobot`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(OUT, "report.png") });
  console.log("  report     /kabinet/NAV001/hisobot");

  // The printed table cards, which is what a cafe physically receives.
  await context.close();
  const wide = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2,
  });
  const sheet = await wide.newPage();
  await sheet.goto(
    `${base}/auth/confirm?token_hash=${(await admin.auth.admin.generateLink({ type: "magiclink", email: "sinov-kafe@flex.local" })).data.properties.hashed_token}&type=magiclink&keyin=/kabinet/NAV001/nuqtalar/chop`,
    { waitUntil: "networkidle", timeout: 60_000 },
  );
  await sheet.waitForTimeout(2500);
  await sheet.screenshot({ path: join(OUT, "cards.png") });
  console.log("  cards      /kabinet/NAV001/nuqtalar/chop");

  await browser.close();
  console.log(`\nWritten to ${OUT}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
