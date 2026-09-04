#!/usr/bin/env node
// Copies the contents of one Supabase project into another.
//
// Written for one job: moving the database from Tokyo to Frankfurt, because
// every request was crossing an ocean to reach it. Kept in the repo rather than
// run as a throwaway, since a script that moves production data should be
// reviewable afterwards and repeatable if the first attempt goes wrong.
//
// It copies rows only. The destination must already have the schema — run
// `npm run db:migrate` against it first — because replaying the migrations is a
// better guarantee of an identical schema than copying one.
//
// Usage:
//   node scripts/copy-project.mjs <source-ref> <destination-ref> [--dry-run]
//
// Both refs are Supabase project ids, and SUPABASE_ACCESS_TOKEN must be a
// personal access token with access to both.

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// The tables to copy. auth.users is deliberately absent: those rows carry
// password hashes and are moved separately and deliberately, not swept along
// with application data.
//
// The order here is only a tie-breaker — the real order is worked out from the
// foreign keys at run time. Writing it by hand got it wrong twice: genesis_cards
// looked independent and points at handles.
const TABLES = [
  "genesis_cards",
  "handles",
  "teams",
  "team_members",
  "team_invoices",
  "orders",
  "payme_transactions",
  "click_transactions",
  "posts",
  "follows",
  "leads",
  "lead_attempts",
  "claim_attempts",
  "profile_views",
  "notifications",
  "notification_settings",
  "design_requests",
  "handle_transfers",
  "telegram_logins",
  "venues",
  "menu_categories",
  "menu_items",
  "venue_requests",
  "venue_invoices",
];

// Written by the migration runner on the destination, and correct there
// already: copying it would claim migrations had run that never did.
const SKIP = new Set(["schema_migrations"]);

/**
 * Parents before children, worked out from the foreign keys themselves.
 *
 * A hand-written order is a guess about a graph the database already knows, and
 * every wrong guess is a failed run halfway through a copy. Self-references —
 * a row pointing at another row in its own table — are ignored: they cannot be
 * resolved by ordering tables, and none here are required.
 */
async function inDependencyOrder(ref, tables) {
  const edges = await query(
    ref,
    `select distinct
       child.relname as child,
       parent.relname as parent
     from pg_constraint c
     join pg_class child on child.oid = c.conrelid
     join pg_class parent on parent.oid = c.confrelid
     join pg_namespace n on n.oid = child.relnamespace
     join pg_namespace pn on pn.oid = parent.relnamespace
     where c.contype = 'f' and n.nspname = 'public' and pn.nspname = 'public'`,
  );

  const wanted = new Set(tables);
  const parents = new Map(tables.map((t) => [t, new Set()]));

  for (const { child, parent } of edges) {
    if (child === parent) continue;
    if (wanted.has(child) && wanted.has(parent)) parents.get(child).add(parent);
  }

  const done = new Set();
  const order = [];

  // Kahn's algorithm, walking the declared list each pass so the output is
  // stable rather than dependent on hash order.
  while (order.length < tables.length) {
    const ready = tables.filter(
      (t) => !done.has(t) && [...parents.get(t)].every((p) => done.has(p)),
    );

    if (ready.length === 0) {
      // A cycle. Everything left goes in declared order and the insert will
      // say so far more precisely than a guess here could.
      order.push(...tables.filter((t) => !done.has(t)));
      break;
    }

    for (const t of ready) {
      done.add(t);
      order.push(t);
    }
  }

  return order;
}

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

// Set once in main(). Passing it to every call was the first version, and one
// of those calls forgot it — so the SQL landed in the Authorization header and
// the API quite rightly said no.
let token = null;

async function query(ref, sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : [];
}

/**
 * The columns a row may actually be inserted into.
 *
 * `handles.normalized` is generated from the letters and the digits, and
 * Postgres refuses any value for it — including the correct one. Read from the
 * destination rather than assumed, because the destination is what will refuse
 * it, and in the same order the table declares so the select lines up.
 */
async function writableColumns(ref, table) {
  const rows = await query(
    ref,
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = '${table}'
       and is_generated = 'NEVER' and is_identity <> 'YES'
     order by ordinal_position`,
  );

  return rows.map((row) => `"${row.column_name}"`);
}

async function main() {
  const [from, to, ...flags] = process.argv.slice(2);
  const dryRun = flags.includes("--dry-run");
  // Off by default: a script that quietly empties tables in whatever project it
  // was pointed at is a mistake waiting for a tired evening.
  const replace = flags.includes("--replace");

  if (!from || !to) {
    console.error("Usage: node scripts/copy-project.mjs <source-ref> <destination-ref>");
    process.exit(1);
  }

  const env = await loadEnv();
  token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error("SUPABASE_ACCESS_TOKEN is not set.");
    process.exit(1);
  }

  console.log(`\n${from} → ${to}${dryRun ? "  (dry run)" : ""}\n`);

  const present = new Set(
    (
      await query(
        from,
        "select table_name from information_schema.tables " +
          "where table_schema = 'public' and table_type = 'BASE TABLE'",
      )
    ).map((row) => row.table_name),
  );

  const ORDER = await inDependencyOrder(
    to,
    TABLES.filter((t) => present.has(t) && !SKIP.has(t)),
  );

  if (replace && !dryRun) {
    // Children first, so nothing is left pointing at a row that just went.
    console.log("  clearing the destination");
    for (const table of [...ORDER].reverse()) {
      await query(to, `delete from public.${table}`);
    }
  }

  let moved = 0;

  for (const table of ORDER) {
    // json_agg over the whole row rather than a column list: the column list is
    // the thing most likely to be wrong, and it would be wrong silently.
    const [{ data }] = await query(
      from,
      `select coalesce(json_agg(t)::text, '[]') as data from public.${table} t`,
    );

    const rows = JSON.parse(data);
    if (rows.length === 0) continue;

    console.log(`  ${table.padEnd(24)} ${rows.length}`);
    moved += rows.length;
    if (dryRun) continue;

    const columns = (await writableColumns(to, table)).join(", ");

    // Dollar-quoted so no amount of apostrophes in a menu can end the string,
    // and json_populate_recordset so every type comes from the destination's
    // own definition rather than from string formatting here.
    await query(
      to,
      `insert into public.${table} (${columns}) ` +
        `select ${columns} from json_populate_recordset(null::public.${table}, $flexmove$${data}$flexmove$)`,
    );
  }

  if (!dryRun) {
    // Every sequence was fed explicit values by the copy, so each still starts
    // at 1 and the next insert would collide with a row that already exists.
    //
    // Two versions of this did nothing before it worked, both silently: the
    // first walked pg_depend and matched no rows, and the copy looked finished
    // while notifications was one insert away from a duplicate key. This asks
    // the question the simple way — which columns default to a sequence, and
    // what is the largest value in each — and pg_get_serial_sequence resolves
    // the name rather than string-matching it.
    //
    // Verified afterwards by reading pg_sequences, which is the only way to
    // know a setval happened: it fails quietly by matching nothing.
    console.log("\n  resetting sequences");
    await query(
      to,
      `do $$
       declare r record; seq text; top bigint;
       begin
         for r in
           select table_name, column_name
           from information_schema.columns
           where table_schema = 'public' and column_default like 'nextval%'
         loop
           seq := pg_get_serial_sequence('public.' || r.table_name, r.column_name);
           if seq is null then continue; end if;
           execute format('select max(%I) from public.%I', r.column_name, r.table_name)
             into top;
           if top is not null then perform setval(seq, top, true); end if;
         end loop;
       end $$;`,
    );

    const sequences = await query(
      to,
      "select sequencename, last_value from pg_sequences " +
        "where schemaname = 'public' and last_value is not null order by 1",
    );
    for (const row of sequences) {
      console.log(`    ${row.sequencename.padEnd(28)} ${row.last_value}`);
    }
  }

  console.log(`\nDone — ${moved} row(s)${dryRun ? " would be copied" : " copied"}.\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
