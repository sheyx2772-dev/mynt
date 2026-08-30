#!/usr/bin/env node
// Applies pending SQL migrations to the Supabase project.
//
// Runs each file in supabase/migrations once, in filename order, and records
// it in a schema_migrations table so re-runs are safe. Uses the Supabase
// Management API, which needs a personal access token:
//
//   1. https://supabase.com/dashboard/account/tokens -> Generate new token
//   2. add it to .env.local as SUPABASE_ACCESS_TOKEN=sbp_...
//
// Usage: npm run db:migrate  [--dry-run]

import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = join(root, "supabase", "migrations");

async function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = await readFile(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (match) env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env.local — fall back to the ambient environment.
  }
  return env;
}

function projectRef(supabaseUrl) {
  const match = String(supabaseUrl ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\./);
  return match?.[1] ?? null;
}

async function runQuery(ref, token, query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const env = await loadEnv();

  const token = env.SUPABASE_ACCESS_TOKEN;
  const ref = projectRef(env.NEXT_PUBLIC_SUPABASE_URL);

  if (!ref) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is missing or malformed in .env.local.");
    process.exit(1);
  }
  if (!token) {
    console.error("SUPABASE_ACCESS_TOKEN is not set.\n");
    console.error("  1. Open https://supabase.com/dashboard/account/tokens");
    console.error("  2. Generate new token, copy it");
    console.error("  3. Add this line to .env.local:\n");
    console.error("       SUPABASE_ACCESS_TOKEN=sbp_your_token_here\n");
    process.exit(1);
  }

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.log("No migrations found.");
    return;
  }

  console.log(`Project ${ref} — ${files.length} migration(s) on disk.\n`);

  await runQuery(
    ref,
    token,
    `create table if not exists schema_migrations (
       version text primary key,
       applied_at timestamptz not null default now()
     );`
  );

  const applied = await runQuery(ref, token, "select version from schema_migrations;");
  const done = new Set((applied ?? []).map((row) => row.version));

  const pending = files.filter((f) => !done.has(f));
  if (pending.length === 0) {
    console.log("Everything is already applied.");
    return;
  }

  for (const file of pending) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");

    if (dryRun) {
      console.log(`would apply  ${file}  (${sql.split("\n").length} lines)`);
      continue;
    }

    process.stdout.write(`applying     ${file} ... `);
    try {
      await runQuery(ref, token, sql);
      await runQuery(
        ref,
        token,
        `insert into schema_migrations (version) values ('${file.replace(/'/g, "''")}');`
      );
      console.log("ok");
    } catch (error) {
      console.log("FAILED");
      console.error(`\n${error.message}\n`);
      console.error("Nothing after this migration was applied.");
      process.exit(1);
    }
  }

  console.log(`\nDone — ${pending.length} migration(s) applied.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
