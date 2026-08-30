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
| `0004_analytics.sql` | profile views, link clicks, aggregation functions |
| `0005_lock_down_stats_functions.sql` | revoke stats functions from the public roles |

### Auth

Sign-in is a one-time email link — Supabase creates the account on first use,
so there is no separate registration step. Enable the email provider in
Authentication → Providers. Supabase's built-in mail service is rate-limited
and intended for testing; connect a real SMTP provider before launch.

Phone/SMS sign-in is not enabled: it needs an SMS provider configured in the
Supabase dashboard.

### The cabinet

`/kabinet` lists what the signed-in user owns and holds. Each handle can be
edited there — name, bio, links, avatar — and carries a QR code served as SVG
from `/{handle}/qr`, for phones without NFC and for printing on the card.

Ownership is enforced in the query rather than in the page: the row is read
and written with a `user_id` filter, so a guessed URL is a 404 and a forged
request updates nothing.

### Analytics

Profile visits and link clicks are counted per handle and shown in the
cabinet: headline totals, a 30-day column chart of daily visits, and clicks
broken down by link.

Nothing that identifies a visitor is stored. A visit records a salted hash of
the day, address and user agent — enough to tell repeat visits apart within a
day, worthless the next morning because the day is part of the hash. The salt
comes from `ANALYTICS_SALT`, falling back to the service role key; without a
salt, a hash of an IPv4 address is reversible by trying all of them. Referrers
are truncated to the host.

Clicks are counted by routing links through `/{handle}/go?to={index}`. The
index selects from the profile's own stored links, so the route cannot be
handed an arbitrary URL and turned into an open redirect. Owners viewing their
own profile are not counted.

### Payments

A handle is reserved for 30 minutes while an order is paid for, and only
becomes claimed once Click or Payme confirms. The reservation reuses the
unique index on `normalized`, so two buyers cannot race for one handle.

With no provider keys the site still works: the claim completes immediately
and free, which is what development and preview environments want.

Both providers call back to this app, so their merchant cabinets need these
endpoints:

| Provider | Setting | URL |
| --- | --- | --- |
| Click | Prepare | `https://mynt.uz/api/click/prepare` |
| Click | Complete | `https://mynt.uz/api/click/complete` |
| Payme | Endpoint | `https://mynt.uz/api/payme` |

The protocol logic lives in [`src/lib/payments`](src/lib/payments) and is
tested against an in-memory store, including the cases Payme's sandbox
certification checks: repeated calls returning identical timestamps, the
12-hour transaction timeout, and cancel-before-perform (-1) versus
cancel-after-perform (-2).

`RUN_DB_TESTS=1 npm test` additionally runs the store against the live
project, creating and then removing its own rows.

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
