-- Mynt: Supabase (Postgres) schema.
-- Run this once in your Supabase project's SQL editor.

create table if not exists handles (
  id uuid primary key default gen_random_uuid(),
  letters char(3) not null,
  digits char(3) not null,
  normalized text generated always as (upper(letters) || digits) stored unique,
  status text not null default 'available' check (status in ('available', 'claimed')),
  owner_name text,
  bio text,
  avatar_url text,
  links jsonb not null default '[]',
  price_paid bigint,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index if not exists handles_normalized_idx on handles (normalized);

alter table handles enable row level security;

create policy "handles are publicly readable"
  on handles for select
  using (true);

-- Writes (claiming a handle) go through the server using the service_role
-- key, which bypasses RLS — no insert/update policy is defined for anon.

-- Genesis cards: sequential serial numbers assigned to physical NFC cards
-- as they're manufactured (mynt.uz/000001, mynt.uz/000002, ...). This is a
-- separate collectible/provenance series from the vanity `handles` above —
-- the low serial number itself is what's scarce, independent of who owns it.
-- The NFC chip is programmed with the URL only; the manufacturer never
-- touches ownership, profile, or resale data — that all lives here.
create table if not exists genesis_cards (
  id uuid primary key default gen_random_uuid(),
  serial integer not null unique check (serial > 0),
  normalized text generated always as (lpad(serial::text, 6, '0')) stored unique,
  owner_handle text references handles (normalized),
  owner_name text,
  status text not null default 'unsold' check (status in ('unsold', 'claimed')),
  minted_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index if not exists genesis_cards_normalized_idx on genesis_cards (normalized);

alter table genesis_cards enable row level security;

create policy "genesis cards are publicly readable"
  on genesis_cards for select
  using (true);
