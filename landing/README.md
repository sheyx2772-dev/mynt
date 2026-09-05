# Flex

> Loyihani birinchi marta qo'lga olayotgan bo'lsangiz — [HANDOFF.md](HANDOFF.md).
> Hozirgi holat, kalitlar qayerdaligi va ish yuritish bo'yicha eslatmalar o'sha yerda.

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

Next.js 16 (App Router) · React 19 · Tailwind v4 · Cloudflare R2 for images.

This app renders pages and asks the backend. Every decision about a person, a
number, a payment or a notice is made in Go, in `../backend`, and the only
credential this app holds is the reader's own session cookie — there is no
database key here, no merchant secret, no bot token, because nothing here
decides anything that would need one. The one seam is
[`src/lib/backend/client.ts`](src/lib/backend/client.ts), typed from the
backend's OpenAPI document by `npm run api` so a field renamed in Go breaks
`npm run typecheck` here rather than a page in front of somebody.

Note that Next.js 16 renamed `middleware.ts` to `proxy.ts` — see
[`src/proxy.ts`](src/proxy.ts), which now does nothing per request and stays
for the day something belongs there.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

The backend has to be running: `cd ../backend && make db && make dev`. With no
R2 keys avatar uploads are skipped; everything else needs the backend.

### Database

There is none here. The schema and its migrations live in
`../backend/internal/database/migrations` — `make migrate` applies them, `make schema-test`
replays them into a scratch database and asserts the schema rejects bad data on
its own. See `../AGENTS.md`.

### Auth

Sign-in is a one-time link sent by email, or a code sent by SMS. Both are the
backend's: it issues the token, it holds the mail and SMS credentials, and it
sets the `flex_session` cookie this app reads. Following the link is what
proves the address, so the account is made at that moment rather than when
somebody typed an address into a form.

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

### Where the pages are

The entry page is a door, not a brochure. It carries four blocks — the brand
line and the handle search, the fork between the two products, the shelf of
things you can hold, and the questions — and explains neither product, because
its job is to find out which one somebody came for.

Each side then has one page that answers everything:

- `/shaxsiy` — the offer, the three steps, what a profile looks like, the
  devices, the price calculator and the plans.
- `/biznes` — the venue product (cafe, hotel, shop, other), its pricing bands,
  the enquiry form, and the staff-card offer with its own form.

`/tarif` still answers and redirects to `/shaxsiy#tarif`: it is printed in
footers and sent in renewal reminders. It is deliberately absent from the
sitemap, which should not spend a crawler's visit on a redirect.

On a phone the entry page is an app rather than a shorter site — see
`AppHome`. Signed in with a claimed handle it opens on that handle and what it
did today instead of on the shop.

### Devices

What Flex sells is the number. Which object carries it — a card, a ring or a
bracelet — is the buyer's choice, and all three open the same profile.
`/qurilmalar` is the shelf: every device and every direction as a picture you
choose between, each opening `/qurilmalar/[id]` with the detail and the price.
The six card designs apply across all the forms; owners pick both in the
cabinet.

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

Migrations under `../backend/internal/database/migrations` still say Mynt in their comments.
They are the record of what was applied to the database, so they are left as
written rather than rewritten after the fact.

The seed rows `MYN042` and `SIR555` keep their old handles; only their text
was updated. Renaming a handle would break `genesis_cards.owner_handle` and
any link already shared.

### Where it runs

Deployed on Vercel as the project `flex`, building `main` on every push.

| | |
|---|---|
| Live | `https://flex-five-kohl.vercel.app` |
| Custom domain | `flex.com.uz` — added to the project, waiting on an `A` record at `@` pointing to `216.198.79.1` |
| Payme | live — the endpoint answers, and was checked both ways in production: correct auth reaches the store, a forged key gets -32504 |
| Click | half-configured. `CLICK_SERVICE_ID` is 99108; `CLICK_MERCHANT_ID` is not shown anywhere in the merchant cabinet and `CLICK_SECRET_KEY` is still to be copied, so the backend registers no Click callback and builds no Click checkout link |

The apex is the canonical host on purpose: Vercel offers to redirect it to
`www` and that offer was declined, because `NEXT_PUBLIC_SITE_URL`, the
backend's `SITE_URL`, the sitemap and every printed card say `flex.com.uz`
without it.

`output: "standalone"` must stay out of `next.config.ts`. It bundles a server
for running in a container, and Vercel's build step instead reads the default
build's file traces — with standalone set, the deploy fails looking for
`.next/next-server.js.nft.json`.

### Migrations

They live in `../backend/internal/database/migrations` and goose applies them:

    cd ../backend && make migrate

`make schema-test` replays the whole history into a scratch database and runs
the constraint assertions first, which is how a migration is checked before it
reaches anything real.

For most of this project's life the schema went in by hand through a SQL
editor, which is why four migrations piled up unapplied at one point. Write the
migration, run the command.

### The payment accounts

Both providers belong to MC LEGAL, contract B/D 29279\TASH, and both were
registered for tijoraat.uz rather than for Flex. Neither had ever taken a
payment, so repointing them broke nothing.

Payme's endpoint is self-service and now points at the deployment. Two things
there are still wrong for a buyer: the kassa is named after the old callback
URL, which is what a payer sees, and the endpoint is the vercel.app address
rather than the domain — both change once the domain resolves.

Click cannot be finished from the cabinet. The callback URLs are set by Click
support, not by the merchant, and `merchant_id` is not displayed anywhere in
it. That needs a call to +998 71 231 0883 quoting the contract number, asking
for the merchant id, for service 99108 to be renamed to Flex against
flex.com.uz, and for the two callbacks to be set:

    https://<backend host>/click/prepare
    https://<backend host>/click/complete

### Before deploying

**Still outstanding: `NEXT_PUBLIC_SITE_URL=https://flex.com.uz` in the deployed
environment.** When it is set, `getSiteOrigin()` never reads a request header.
When it is not, the code falls back to the canonical origin rather than trusting
the header — a `Host` or `X-Forwarded-Host` an attacker controls would otherwise
end up inside the one-time sign-in link mailed to a victim. Leaving it unset is
safe but leaves the guarantee resting on the fallback instead of on config.

`ANALYTICS_SALT` moved to the backend, which is what counts a visit now. Set it
there to any long random string and then never change it: the visitor hash is
salted with it, so rotating it silently breaks the continuity of every
profile's view count.

### Known issue: deleting an account

Deleting an account fails while that account still has rows in a table
referencing `auth.users`. Migration 00009 fixed two contributing causes — the
deleting role held no DELETE or UPDATE privilege on any of those tables, and
the SET NULL on `handles` tripped the claimed-needs-an-owner constraint — but
the failure persisted against Supabase's admin API and the remaining cause was
never identified. Row level security was ruled out by test.

Nothing exposes an account-deletion flow, so nothing user-facing is blocked.
Removing a person's posts, follows and handles first and then deleting the
account does work. Worth retrying now that the delete would be an ordinary
statement in `internal/auth` rather than a call to somebody's admin API — the
error it raises will say which constraint, which is what was missing.

### Residents and the public profile

`/rezidentlar` is the public directory: claimed handles ranked by views, with
search across handle, name and city, and a three-day leaderboard above it.
Reserved handles never appear in either — a reservation is an unfinished
purchase, not a resident, and traffic to one does not earn a place in the
ranking.

A profile shows its own view count, when the owner was last active, their
city, contact email and tags. The count is denormalised onto the handle row:
`profile_views` itself is never read by anything public, because its rows carry
visitor hashes and referrers that belong to the owner alone. The leaderboard
reads the aggregate and nothing else.

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

**The providers now call back to the backend, not to this app.** Both cabinets
have to be repointed at its host — one callback URL per merchant account, so
exactly one deployment may answer:

| Provider | Setting | URL |
| --- | --- | --- |
| Click | Prepare | `https://<backend host>/click/prepare` |
| Click | Complete | `https://<backend host>/click/complete` |
| Payme | Endpoint | `https://<backend host>/payme` |

Payme was certified against `https://flex.com.uz/api/payme`, which no longer
exists — that route and the store behind it were deleted when the protocol
moved. **Repoint the cabinet before taking another payment**, or a settlement
will be posted to a 404 and retried for hours.

The protocol lives in `../backend/internal/payments` and is tested against an
in-memory store, including the cases Payme's sandbox certification checks:
repeated calls returning identical timestamps, the 12-hour transaction timeout,
and cancel-before-perform (-1) versus cancel-after-perform (-2).

## Taking money for a venue

Nothing in the app charges anybody. A cafe presses "Hisob-faktura olish" in
`/kabinet/{handle}/obuna`, gets a document, and its accountant transfers against
it — which is how suppliers are paid here, and the reason an uncertified card
gateway does not stop the venue product being sold.

When the transfer lands, mark the invoice paid. Extending the venue and settling
the document are one statement on purpose: an invoice marked paid against a
venue that was never extended is the worst of the three possible states.

```sql
select settle_venue_invoice('<invoice-id>');
```

It returns `true` once and `false` for every repeat, so paying twice extends
once. `settle_team_invoice('<invoice-id>')` is the same thing for company
accounts. Both run through `npm run db:status`-style access, i.e. the
management API or the SQL editor; neither is exposed to the app.

A venue is given thirty days when it is created, so a new customer can be shown
the whole product before any money moves. When the date passes, the guest's menu
keeps working — a sticker on a table cannot die because an invoice is late — and
the call button and the report are what stop.

The daily run at `/api/cron/eslatma` warns a venue seven days out and tells it
again on the day it lapses, since the second notice is the one that gets a venue
back. Both are recorded against the expiry they were sent for, so paying earns a
fresh pair next period rather than silencing the venue forever.

## Where this runs, and why it matters more than caching

The database is in Frankfurt (`eu-central-1`) and `vercel.json` pins the
functions to `fra1`, the same region.

It started in Tokyo. Measured from Tashkent, the round trip there was about
130 ms, and every page here talks to the database several times in sequence —
the guest menu resolves a handle, then a venue, then its categories and items.
Meanwhile Vercel's default function region is `iad1`, Washington, which would
have put each of those hops across the Pacific and back before the answer began
its own journey to Uzbekistan. So the number that decides how fast the product
feels was never how quickly we render.

Moving it was `scripts/copy-project.mjs`: a new project in Frankfurt, every
migration replayed into it, the three accounts moved with their ids and password
hashes intact so nothing pointing at them broke, then 1018 rows copied
parents-first in an order worked out from the foreign keys. The old project is
untouched and `.env.local.tokyo-backup` holds its keys, so the way back is one
file copy until it is deliberately deleted.

Two things that copy has to get right and did not at first, both recorded in the
script: generated columns cannot be written to even with the correct value, and
every sequence must be moved past the rows that were copied or the next insert
collides with a row that already exists. The second failed silently twice.

Confirm the region took in the project's Functions settings after deploying: it
is configurable there too, and the dashboard wins if the two disagree.

Caching the menu was considered first and is deliberately not done. In Next 16
`use cache` requires `cacheComponents: true`, which turns on Partial Prerendering
for every route in the app and would need auth, language and payment routes
migrated with it; `unstable_cache` still works but the release notes call it
replaced. Against that: a busy cafe generates a request every few seconds, and
the page renders in tens of milliseconds once the database is close. Move the
compute to the data first, and measure again before paying for a caching
migration.

## The daily run

`vercel.json` schedules `/api/cron/eslatma` once a day at 09:00 UTC — two in the
afternoon in Tashkent, which is a working hour for the person who has to act on
what it says. It warns a venue seven days before its subscription ends and tells
it again the day it lapses, and it reminds a personal plan the same way.

The route refuses anybody without `Bearer $CRON_SECRET`, and Vercel sends
exactly that header when the variable is set on the project. Without one set the
route answers 503 rather than defaulting open — which is how it was found to be
unconfigured in production, having quietly answered 503 since it was written.

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
