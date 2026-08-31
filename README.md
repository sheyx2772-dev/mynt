# Flex

Digital identity and networking for Uzbekistan: a rare handle, a public
profile page, and an NFC card that opens it with one tap.

`flex.com.uz/MYN042` is someone's profile. `flex.com.uz/000001` is a physical card.

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
| `0006_social_profile.sql` | city, tags, last seen, public view count, leaderboard |
| `0007_posts_and_follows.sql` | posts, follows, counter triggers |
| `0008_account_deletion.sql` | privileges for cascades, orphaned-handle handling |
| `0009_card_designs.sql` | per-handle card design, restricted to the known set |
| `0010_device_types.sql` | which form factor an owner chose |

### Auth

Sign-in is a one-time email link — Supabase creates the account on first use,
so there is no separate registration step. Enable the email provider in
Authentication → Providers. Supabase's built-in mail service is rate-limited
and intended for testing; connect a real SMTP provider before launch.

Phone/SMS sign-in is not enabled: it needs an SMS provider configured in the
Supabase dashboard.

### Installable app (PWA)

The site installs to a phone's home screen and opens in its own window, which
covers the app-shaped part of the product without a second codebase or an app
store. `src/app/manifest.ts` declares it; an installed copy starts on
`/kabinet` rather than the marketing page.

`public/sw.js` caches the immutable build output and falls back to `/oflayn`
when a navigation cannot reach the network. Profile pages are deliberately not
cached — a handle can be claimed, edited or released at any moment, and a
stale profile is worse than an honest offline notice. Nothing under `/api`,
`/auth` or `/kabinet` is cached either. The worker is registered only in
production builds; in development it would serve stale code across hot
reloads.

`npm run icons` regenerates the manifest icons from the brand mark. It
rasterises and encodes the PNGs directly, which keeps an image-processing
dependency out of the tree for four files that change approximately never. The
Apple touch icon lives at `src/app/apple-icon.png`, not in `public/` — Next
only emits `<link rel="apple-touch-icon">` for the file convention, and
without that link iOS screenshots the page instead of using the mark.

To try it locally, PWA features need a production build: `npm run build && npm
run start`.

### The cabinet

`/kabinet` lists what the signed-in user owns and holds. Each handle can be
edited there — name, bio, links, avatar — and carries a QR code served as SVG
from `/{handle}/qr`, for phones without NFC and for printing on the card.

Ownership is enforced in the query rather than in the page: the row is read
and written with a `user_id` filter, so a guessed URL is a 404 and a forged
request updates nothing.

### Product photography

`public/mahsulot/` is where real photographs go — the card, the ring, the
bracelet, and someone tapping one against a phone. It is empty, and until it
is not, every device on the site is drawn in CSS.

Only photographs of Flex's own products belong there. Images of other
companies' products, supplier catalogue shots and stock photos are all
somebody else's copyright, frequently carry somebody else's trademark, and
show a product Flex does not sell — a customer who orders from a picture of
another company's ring has been misled.

Reference photography is useful for a different purpose and is used that way
here: the recessed disc the NFC mark sits in, the specular sweep across a ring
band, and the fanned arrangement a supplier catalogue uses to show a range all
came from looking at how these objects are actually made and photographed.

### Devices

What Flex sells is the number. Which object carries it — a card, a ring or a
bracelet — is the buyer's choice, and all three open the same profile.
`/qurilmalar` presents the three forms and the six designs, which apply
across all of them; owners pick both in the cabinet.

Each form is drawn in CSS at its own proportions rather than shipped as an
image, so a preview shows the viewer's own handle and stays sharp at any size.
`DeviceFace` takes a `compact` variant because the cabinet picker renders
cells about 90px wide, where type sized for a 300px showcase overflows.

Deliberately not modelled yet: one person owning several items. That is a
fulfilment concern and there are no orders. `handles.device_type` records the
chosen form; when someone buys a card and a ring together it becomes a table.

### Cards

`/kartalar` shows the six card designs, each drawn in CSS at a bank card's
aspect ratio rather than shipped as an image, so a preview stays sharp at any
size and shows the viewer's own handle. Owners pick one in the cabinet; the
set is closed by a check constraint, so a stored design can never be one the
renderer cannot draw.

Every design is original. Cards carrying someone else's logo — a car marque,
a cartoon character, a tournament — infringe the moment they are sold, and
they are not a differentiator either: a logo can be copied by anyone. A low
genesis serial cannot.

### Posts and following

Handles can post, and accounts can follow handles. `/lenta` shows the posts of
everything the signed-in account follows; a profile carries a Vizitka/Postlar
tab pair, driven by a query parameter so both stay server-rendered.

Follower and post counts are moved by database triggers rather than by
application code, so they cannot drift from the rows they count no matter
which path removes a post or a follow. `follows` is readable only by the
account that owns the row; posts are public by design.

### The name

The project was called Mynt until 31 August 2026. It was renamed to Flex
because "Mynt" was heard as a coarse word by Russian speakers, and the site's
whole distribution runs on people saying the name out loud.

Migrations under `supabase/migrations` still say Mynt in their comments. They
are the record of what was applied to the database, so they are left as
written rather than rewritten after the fact.

The seed rows `MYN042` and `SIR555` keep their old handles; only their text
was updated. Renaming a handle would break `genesis_cards.owner_handle` and
any link already shared.

### Before deploying

Two settings must change or sign-in will not work in production, and one of
them is also a security boundary.

1. **`NEXT_PUBLIC_SITE_URL=https://flex.com.uz`** in the deployed environment. When
   it is set, `getSiteOrigin()` never reads a request header. When it is not,
   the code falls back to the canonical origin rather than trusting the
   header — a `Host` or `X-Forwarded-Host` an attacker controls would
   otherwise end up inside the one-time sign-in link mailed to a victim.
2. **Supabase → Authentication → URL Configuration.** Site URL is still
   `http://localhost:3000` and the Redirect URL allow-list is empty, so every
   sign-in link would point at localhost. Set the Site URL to
   `https://flex.com.uz` and add the redirect URLs the app uses. Keep the
   allow-list specific — a wildcard removes the second line of defence behind
   the one above.

### Known issue: deleting an account

Deleting a user through Supabase's admin API fails with "Database error
deleting user" whenever that user still has rows in a table referencing
`auth.users`. Migration 0008 fixed two contributing causes — the deleting role
held no DELETE or UPDATE privilege on any of those tables, and the SET NULL on
`handles` tripped the claimed-needs-an-owner constraint — but the failure
persists and the remaining cause has not been identified. Row level security
was ruled out by test.

The app exposes no account-deletion flow, so nothing user-facing is blocked.
Removing a user's posts, follows and handles first and then deleting the
account does work. Diagnosing this properly needs the project's auth logs.

### Residents and the public profile

`/rezidentlar` is the public directory: claimed handles ranked by views, with
search across handle, name and city, and a three-day leaderboard above it.
Reserved handles never appear in either — a reservation is an unfinished
purchase, not a resident, and traffic to one does not earn a place in the
ranking.

A profile shows its own view count, when the owner was last active, their
city, contact email and tags. The count is denormalised onto the handle row:
`profile_views` itself stays closed, because its rows carry visitor hashes and
referrers that belong to the owner alone. The leaderboard reads that table
through a `security definer` function that returns the aggregate and nothing
else.

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
| Click | Prepare | `https://flex.com.uz/api/click/prepare` |
| Click | Complete | `https://flex.com.uz/api/click/complete` |
| Payme | Endpoint | `https://flex.com.uz/api/payme` |

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
| `npm run icons` | Regenerate the PWA icons from the brand mark |
