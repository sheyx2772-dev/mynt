-- Mynt: local Postgres schema.
-- Applied automatically on first `docker compose up` via
-- docker-entrypoint-initdb.d (see docker-compose.yml).

create table if not exists handles (
  id uuid primary key default gen_random_uuid(),
  letters char(3) not null,
  digits char(3) not null,
  normalized text generated always as (upper(letters) || digits) stored unique,
  status text not null default 'available' check (status in ('available', 'claimed')),
  owner_name text,
  bio text,
  links jsonb not null default '[]',
  price_paid bigint,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index if not exists handles_normalized_idx on handles (normalized);

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
