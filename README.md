# Mynt

Digital identity and networking for Uzbekistan: a rare handle, a public
profile page, and an NFC card that opens it with one tap.

`mynt.uz/MYN042` is someone's profile. `mynt.uz/000001` is a physical card.

## How the two namespaces work

**Vanity handles** — three letters plus three digits (`AAA000`). Price is a
base amount multiplied by two rarity factors, one for the letters and one for
the digits, so `AAA777` costs far more than `QXZ483`. The rules live in
[`src/lib/pricing.ts`](src/lib/pricing.ts) and the site shows the full
breakdown before anyone pays.

**Genesis cards** — six-digit manufacturing serials (`000001`, `000002`, …).
A separate collectible series where the low number itself is the scarce thing,
independent of who owns it. The NFC chip carries only the URL; ownership and
profile data live in the database.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (Postgres + Auth)
· Cloudflare R2 for images.

Note that Next.js 16 renamed `middleware.ts` to `proxy.ts` — see
[`src/proxy.ts`](src/proxy.ts), which keeps the Supabase auth session fresh.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

The app degrades gracefully without credentials: with no Supabase keys it
serves demo profiles, and with no R2 keys avatar uploads are skipped.

### Database

Migrations are plain SQL in [`supabase/migrations`](supabase/migrations),
applied in filename order by `npm run db:migrate`. Each file runs once and is
recorded in a `schema_migrations` table, so re-running is safe. The runner
needs `SUPABASE_ACCESS_TOKEN` in `.env.local` — create one under
[account tokens](https://supabase.com/dashboard/account/tokens). Use
`npm run db:status` to see what is pending without applying it.

`npm run db:test` replays every migration against a throwaway Postgres
container and asserts that the schema rejects bad data on its own — wrong
handle formats, claimed handles with no owner, negative order amounts, a
second live transaction for one order. It needs Docker but no Supabase
credentials, so schema changes can be checked before they reach the project.

| Migration | What it adds |
| --- | --- |
| `0001_initial.sql` | `handles` and `genesis_cards` tables, public-read RLS |
| `0002_auth_and_ownership.sql` | claim ownership, format constraints, rate limiting |
| `0003_payments.sql` | orders, Click/Payme transactions, handle reservations |

### Auth

Sign-in is a one-time email link — Supabase creates the account on first use,
so there is no separate registration step. Enable the email provider in
Authentication → Providers. Supabase's built-in mail service is rate-limited
and intended for testing; connect a real SMTP provider before launch.

Phone/SMS sign-in is not enabled: it needs an SMS provider configured in the
Supabase dashboard.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | Type check |
| `npm run db:migrate` | Apply pending database migrations |
| `npm run db:status` | Show pending migrations without applying |
| `npm run db:test` | Replay migrations on a local Postgres and check constraints |
