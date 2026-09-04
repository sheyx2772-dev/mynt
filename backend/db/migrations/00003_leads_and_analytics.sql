-- What a number does, and what comes back from it.
--
-- Two things an owner is paying for. The statistics tell them the card they
-- bought is the thing bringing people — which a tap alone cannot, because a tap
-- arrives as a direct navigation with no referrer and looks exactly like
-- somebody typing the address. And the contacts are the reverse of everything
-- else on a card: instead of the owner handing over their details, the visitor
-- leaves theirs.
--
-- No row level security here either, and this time it would have been pointless
-- rather than redundant: nothing but the backend has a key, and the backend
-- checks ownership before it reads. The tables are simply closed.

-- +goose Up

-- Contacts left on a profile by the people who opened it.
create table leads (
  id bigserial primary key,
  handle_id uuid not null references handles (id) on delete cascade,

  name text not null check (char_length(name) between 1 and 80),
  phone text check (phone is null or phone ~ '^[0-9+()\- ]{7,30}$'),
  email text check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  company text check (company is null or char_length(company) <= 80),
  note text check (note is null or char_length(note) <= 500),

  -- Where the visitor was standing when they sent it.
  source text check (source is null or source in ('nfc', 'qr', 'share')),
  created_at timestamptz not null default now(),

  -- A submission with a name and no way to answer it is not a lead.
  constraint leads_reachable check (phone is not null or email is not null)
);

create index leads_handle_idx on leads (handle_id, created_at desc);

-- Rate limiting for the public form, kept separate from the row it creates so
-- that a refused attempt is still counted. Two windows, both an hour: one per
-- source so a script cannot fill a profile with noise, one per profile so it
-- cannot be buried even from many sources.
create table lead_attempts (
  id bigserial primary key,
  ip inet,
  handle text,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index lead_attempts_ip_idx on lead_attempts (ip, created_at desc);
create index lead_attempts_handle_idx on lead_attempts (handle, created_at desc);

-- Visits, counted without keeping anything that identifies a visitor.
--
-- The hash mixes the day, a server secret, the address and the user agent: it
-- separates repeat visits within a day and is worthless the next morning,
-- because tomorrow the same person hashes to something else. The salt matters —
-- a bare hash of an IPv4 address is reversible by trying all four billion.
create table profile_views (
  id bigserial primary key,
  handle text not null,
  visitor_hash text check (visitor_hash is null or char_length(visitor_hash) <= 64),
  -- Host only. A full referring URL can carry query parameters that are none of
  -- our business.
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 255),
  -- Only the values we issue in our own links are stored. The parameter sits in
  -- a URL anybody can edit, so anything else would make the owner's breakdown
  -- whatever a passer-by decided to type.
  source text check (source is null or source in ('nfc', 'qr', 'share')),
  created_at timestamptz not null default now()
);

create index profile_views_handle_idx on profile_views (handle, created_at desc);
create index profile_views_source_idx on profile_views (handle, source, created_at desc);

create table link_clicks (
  id bigserial primary key,
  handle text not null,
  label text not null check (char_length(label) <= 80),
  visitor_hash text check (visitor_hash is null or char_length(visitor_hash) <= 64),
  created_at timestamptz not null default now()
);

create index link_clicks_handle_idx on link_clicks (handle, created_at desc);

-- The daily series behind the chart, zero-filled so a quiet day is a gap in the
-- bars rather than a missing one — a chart that silently drops empty days
-- reads as though the quiet period never happened.
-- +goose StatementBegin
create function handle_stats(p_handle text, p_days integer default 30)
returns table (day date, views bigint, clicks bigint, visitors bigint)
language sql
stable
as $$
  with bounds as (
    select (current_date - (p_days - 1)) as first_day
  ),
  days as (
    select generate_series((select first_day from bounds), current_date, interval '1 day')::date as day
  ),
  v as (
    select created_at::date as day, count(*) as n, count(distinct visitor_hash) as u
    from profile_views
    where handle = p_handle and created_at >= (select first_day from bounds)
    group by 1
  ),
  c as (
    select created_at::date as day, count(*) as n
    from link_clicks
    where handle = p_handle and created_at >= (select first_day from bounds)
    group by 1
  )
  select days.day,
         coalesce(v.n, 0) as views,
         coalesce(c.n, 0) as clicks,
         coalesce(v.u, 0) as visitors
  from days
  left join v on v.day = days.day
  left join c on c.day = days.day
  order by days.day;
$$;
-- +goose StatementEnd

-- +goose StatementBegin
create function handle_link_stats(p_handle text, p_days integer default 30)
returns table (label text, clicks bigint)
language sql
stable
as $$
  select label, count(*) as clicks
  from link_clicks
  where handle = p_handle
    and created_at >= (current_date - (p_days - 1))
  group by label
  order by clicks desc;
$$;
-- +goose StatementEnd

-- "togridan" is everything we did not issue a link for: somebody typing the
-- address, or a browser that sent no referrer.
-- +goose StatementBegin
create function handle_source_stats(p_handle text, p_days integer default 30)
returns table (source text, views bigint)
language sql
stable
as $$
  select coalesce(source, 'togridan') as source, count(*) as views
  from profile_views
  where handle = p_handle
    and created_at >= (current_date - (p_days - 1))
  group by 1
  order by 2 desc;
$$;
-- +goose StatementEnd

-- The public counter on the handle row, moved by the same write that records
-- the visit so the two cannot drift.
-- +goose StatementBegin
create function increment_view_count(p_handle text) returns void
language sql
as $$
  update handles set view_count = view_count + 1 where normalized = p_handle;
$$;
-- +goose StatementEnd

-- +goose Down

drop function if exists increment_view_count(text);
drop function if exists handle_source_stats(text, integer);
drop function if exists handle_link_stats(text, integer);
drop function if exists handle_stats(text, integer);
drop table if exists link_clicks;
drop table if exists profile_views;
drop table if exists lead_attempts;
drop table if exists leads;
