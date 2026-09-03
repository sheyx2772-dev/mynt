#!/usr/bin/env node
// Pushes this machine's configuration to the Vercel project, and pins the
// region the functions run in.
//
// Written after moving the database to Frankfurt, when production was still
// pointed at Tokyo and running its functions from Washington — so every query
// crossed an ocean twice. Kept in the repo rather than run as a throwaway,
// because it writes secrets to a third party and that is a thing somebody
// should be able to read afterwards.
//
// Usage:
//   node scripts/vercel-sync.mjs [--dry-run]
//
// Needs VERCEL_TOKEN in .env.local. Values are never printed.

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const PROJECT = "prj_rOfGxrQfL8iq0Pb7BqKUgWMIts8W";
const REGION = "fra1";

// An allowlist, not "everything in .env.local".
//
// That file also holds credentials that operate the accounts themselves — the
// Supabase management token, this Vercel token, the new database's Postgres
// password. None of those belong in a running web server: a server that is
// broken into should not be able to delete the project it runs on.
const SEND = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "PAYME_MERCHANT_ID",
  "PAYME_SECRET_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "ANALYTICS_SALT",
  "TELEGRAM_BOT_TOKEN",
  "NEXT_PUBLIC_TELEGRAM_BOT_NAME",
  "CRON_SECRET",
];

const TARGETS = ["production", "preview"];

async function loadEnv() {
  const env = { ...process.env };
  const raw = await readFile(join(root, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

let token = null;

async function api(path, init = {}) {
  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const env = await loadEnv();

  token = env.VERCEL_TOKEN;
  if (!token) {
    console.error("VERCEL_TOKEN is not set in .env.local.");
    process.exit(1);
  }

  console.log(`\nProject ${PROJECT}${dryRun ? "  (dry run)" : ""}\n`);

  const existing = new Map(
    (await api(`/v9/projects/${PROJECT}/env?decrypt=false`)).envs.map((e) => [e.key, e]),
  );

  for (const key of SEND) {
    const value = env[key];
    if (!value) {
      console.log(`  ${key.padEnd(32)} skipped — not set here`);
      continue;
    }

    const current = existing.get(key);

    if (dryRun) {
      console.log(`  ${key.padEnd(32)} ${current ? "would update" : "would create"}`);
      continue;
    }

    if (current) {
      await api(`/v9/projects/${PROJECT}/env/${current.id}`, {
        method: "PATCH",
        body: JSON.stringify({ value }),
      });
      console.log(`  ${key.padEnd(32)} updated`);
    } else {
      await api(`/v10/projects/${PROJECT}/env`, {
        method: "POST",
        body: JSON.stringify({
          key,
          value,
          type: key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
          target: TARGETS,
        }),
      });
      console.log(`  ${key.padEnd(32)} created`);
    }
  }

  // The dashboard's own region setting overrides vercel.json, so the file alone
  // is not enough — this is the setting that was still saying Washington.
  const project = await api(`/v9/projects/${PROJECT}`);
  console.log(`\n  region is ${project.serverlessFunctionRegion ?? "default"}`);

  if (project.serverlessFunctionRegion !== REGION) {
    if (dryRun) {
      console.log(`  would set region to ${REGION}`);
    } else {
      await api(`/v9/projects/${PROJECT}`, {
        method: "PATCH",
        body: JSON.stringify({ serverlessFunctionRegion: REGION }),
      });
      console.log(`  region set to ${REGION}`);
    }
  }

  console.log("\nDone. Redeploy for the new values to take effect.\n");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
