-- Flex migration 0036 — the cafe menu.
--
-- The venue page has described this since it was written and nothing behind it
-- existed. This is the first half: a menu somebody can edit and a guest can
-- read. Calling a waiter and asking for the bill are requests, which need an
-- inbox, and that is the next migration.
--
-- A venue hangs off a claimed handle rather than being its own address. That is
-- the whole economy of the thing: a cafe buys one number, the number is on the
-- table stand, and every table is that number plus which table it is. Charging
-- for twenty numbers would price a twenty-table cafe out of the product.
--
-- Tables and rooms are deliberately not modelled yet. A point is a number in a
-- URL, and until a request can be sent from one there is nothing to store
-- about it — a table that only appears in a heading is a string, not a row.

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),

  -- One venue per handle, and the handle is what the NFC tag points at.
  handle_id uuid not null unique references handles (id) on delete cascade,

  name text not null check (char_length(trim(name)) between 2 and 120),
  kind text not null default 'cafe' check (kind in ('cafe', 'hotel', 'shop', 'other')),

  -- What a guest looks for that is not a dish: when it is open, where it is,
  -- and the password they came for.
  hours text check (hours is null or char_length(hours) <= 120),
  address text check (address is null or char_length(address) <= 200),
  wifi_name text check (wifi_name is null or char_length(wifi_name) <= 60),
  wifi_password text check (wifi_password is null or char_length(wifi_password) <= 60),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,

  name text not null check (char_length(trim(name)) between 1 and 60),
  -- Optional, because a translation nobody has written is better absent than
  -- machine-made. The renderer falls back to `name`.
  name_ru text check (name_ru is null or char_length(name_ru) <= 60),
  name_en text check (name_en is null or char_length(name_en) <= 60),

  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists menu_categories_venue_idx
  on menu_categories (venue_id, position, created_at);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  category_id uuid references menu_categories (id) on delete set null,

  name text not null check (char_length(trim(name)) between 1 and 120),
  name_ru text check (name_ru is null or char_length(name_ru) <= 120),
  name_en text check (name_en is null or char_length(name_en) <= 120),

  note text check (note is null or char_length(note) <= 200),
  note_ru text check (note_ru is null or char_length(note_ru) <= 200),
  note_en text check (note_en is null or char_length(note_en) <= 200),

  -- So'm, whole. A menu price with tiyin on it does not exist in this country.
  price bigint not null check (price >= 0 and price <= 100000000),

  -- The stop list. Today's absence is not a deletion: the dish comes back
  -- tomorrow and nobody should have to type it again.
  available boolean not null default true,

  photo_url text check (photo_url is null or photo_url ~ '^https://'),

  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_venue_idx
  on menu_items (venue_id, category_id, position, created_at);

-- A venue's menu is public: it is printed on a table stand for strangers to
-- read. Everything else about a venue is the owner's, and every write goes
-- through the server, which holds the service role.
alter table venues enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;

drop policy if exists "venues are publicly readable" on venues;
create policy "venues are publicly readable" on venues for select using (true);

drop policy if exists "menu categories are publicly readable" on menu_categories;
create policy "menu categories are publicly readable" on menu_categories for select using (true);

drop policy if exists "menu items are publicly readable" on menu_items;
create policy "menu items are publicly readable" on menu_items for select using (true);

-- The Wi-Fi password is the one field on a venue that is not for strangers to
-- scrape in bulk, and a select policy cannot hide a column. So anon is granted
-- the columns a guest needs and not that one; the server reads the full row.
revoke select on venues from anon;
grant select (id, handle_id, name, kind, hours, address, wifi_name, created_at, updated_at)
  on venues to anon;

create or replace function flex_touch_venue() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists venues_touch on venues;
create trigger venues_touch before update on venues
  for each row execute function flex_touch_venue();

drop trigger if exists menu_items_touch on menu_items;
create trigger menu_items_touch before update on menu_items
  for each row execute function flex_touch_venue();
