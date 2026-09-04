-- The thing that is sold.
--
-- Two namespaces, which look alike and are not. A **handle** is three letters
-- and three digits (`MYN042`) and is priced by how rare that combination is. A
-- **genesis card** is a six-digit manufacturing serial (`000001`) where the low
-- number itself is the scarce thing, whoever ends up owning it.
--
-- This consolidates what forty-six Supabase migrations arrived at, rather than
-- replaying them. Those files are the record of how that database got where it
-- is and they stay where they are; this database starts at the answer. What
-- changed on the way across: ownership points at our own `users` table, and
-- there is no row level security, because there is no client with a key any
-- more — everything reaches this table through the backend, which is the whole
-- reason the backend exists.

-- +goose Up

create table handles (
  id uuid primary key default gen_random_uuid(),

  -- `char(3)` alone accepted "123" as letters and "abc" as digits. The shape is
  -- printed on a physical card, so it is guaranteed here rather than trusted to
  -- whatever wrote the row.
  letters char(3) not null check (letters ~ '^[A-Z]{3}$'),
  digits char(3) not null check (digits ~ '^[0-9]{3}$'),
  normalized text generated always as (upper(letters) || digits) stored unique,

  status text not null default 'available'
    check (status in ('available', 'reserved', 'claimed')),

  -- Nulled rather than cascaded when an account goes: the number was paid for,
  -- and a deleted account should free it, not destroy the record of it.
  user_id uuid references users (id) on delete set null,

  -- A claimed number has an owner and a date. Without this, a bug that sets the
  -- status without setting the owner produces a profile nobody can edit and
  -- nobody can buy.
  constraint handles_claimed_has_owner
    check (status <> 'claimed' or (user_id is not null and claimed_at is not null)),

  -- Held for thirty minutes while an order is paid for. The unique index on
  -- `normalized` is what stops two buyers racing for one number.
  reserved_until timestamptz,
  constraint handles_reserved_has_deadline
    check (status <> 'reserved' or reserved_until is not null),

  -- The profile.
  owner_name text check (owner_name is null or char_length(owner_name) <= 80),
  bio text check (bio is null or char_length(bio) <= 280),
  avatar_url text,
  banner_url text,
  -- Rebuilt from validated parts by the application, never stored as typed:
  -- these are rendered as links on a page anybody can open.
  links jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,

  city text check (city is null or char_length(city) <= 60),
  contact_email text check (contact_email is null or contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text check (phone is null or phone ~ '^[0-9+()\- ]{7,30}$'),
  position text check (position is null or char_length(position) <= 80),
  company text check (company is null or char_length(company) <= 80),
  tags text[] not null default '{}',

  -- What the card is made to look like, and which object carries it. Both are
  -- drawn by the site from a closed set, so a stored value that the renderer
  -- cannot draw would be a blank card.
  card_design text not null default 'genesis',
  device_type text not null default 'card'
    check (device_type in ('card', 'ring', 'bracelet')),
  -- Artwork commissioned for this number alone, which outranks the catalogue
  -- design. Written only by the process that fulfils a design order.
  custom_design_url text,

  -- The subscription. The column says what was bought; the date says whether it
  -- still holds, and a lapsed premium falls back to free rather than going dark
  -- — the number was paid for and stays reachable.
  plan text not null default 'free' check (plan in ('free', 'premium')),
  plan_expires_at timestamptz,
  -- The expiry a renewal reminder was last sent for, so paying earns a fresh
  -- reminder next period rather than silencing the number forever.
  plan_reminded_for timestamptz,

  price_paid bigint check (price_paid is null or price_paid >= 0),
  -- Set when a number was given rather than sold, and why.
  gift_reason text check (gift_reason is null or char_length(gift_reason) <= 200),

  -- Denormalised so a profile page can show the count without opening
  -- `profile_views`, whose rows are the owner's business alone.
  view_count bigint not null default 0 check (view_count >= 0),
  last_seen_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index handles_user_idx on handles (user_id);
-- A reservation that is never paid for must not hold a number forever; this is
-- the index the sweep reads.
create index handles_reserved_idx on handles (reserved_until)
  where status = 'reserved';
create index handles_plan_expiry_idx on handles (plan_expires_at)
  where plan = 'premium';
-- The public directory ranks by views.
create index handles_claimed_views_idx on handles (view_count desc)
  where status = 'claimed';

create trigger handles_touch_updated_at
  before update on handles
  for each row execute function touch_updated_at();

-- Manufacturing serials. A separate series: the number is scarce because of
-- when the card was made, not because of the letters somebody chose.
create table genesis_cards (
  id uuid primary key default gen_random_uuid(),
  serial integer not null unique check (serial > 0),
  normalized text generated always as (lpad(serial::text, 6, '0')) stored unique,

  -- Which profile it opens, once somebody has bound it to one. The chip itself
  -- carries only a URL; ownership lives here.
  owner_handle text references handles (normalized),
  owner_name text check (owner_name is null or char_length(owner_name) <= 80),

  status text not null default 'unsold' check (status in ('unsold', 'claimed')),
  constraint genesis_claimed_has_handle
    check (status <> 'claimed' or owner_handle is not null),

  minted_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index genesis_owner_idx on genesis_cards (owner_handle);

-- Claiming is cheap to attempt and expensive to undo, so it is counted twice:
-- per account, which stops one person hoarding, and per source, which stops one
-- script driving many throwaway accounts. A refused attempt is still recorded,
-- so hammering the limit does not reset it.
create table claim_attempts (
  id bigserial primary key,
  user_id uuid references users (id) on delete cascade,
  ip inet,
  handle text,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index claim_attempts_user_idx on claim_attempts (user_id, created_at desc);
create index claim_attempts_ip_idx on claim_attempts (ip, created_at desc);

-- +goose Down

drop table if exists claim_attempts;
drop table if exists genesis_cards;
drop table if exists handles;
