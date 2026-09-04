-- Mynt migration 0004 — profile analytics.
--
-- The landing page promises visit and link-click statistics. This records
-- them without keeping anything that identifies a visitor: no IP address, no
-- user agent, only a salted hash that rotates every day, which is enough to
-- separate repeat visits within a day and useless for anything else.

create table if not exists profile_views (
  id bigserial primary key,
  handle text not null,
  -- sha256(day + salt + ip + user agent). Rotates daily and is never shown.
  visitor_hash text,
  -- Host only, so a referring URL cannot carry query parameters in with it.
  referrer_host text,
  created_at timestamptz not null default now()
);

create index if not exists profile_views_handle_idx
  on profile_views (handle, created_at desc);

create table if not exists link_clicks (
  id bigserial primary key,
  handle text not null,
  label text not null,
  visitor_hash text,
  created_at timestamptz not null default now()
);

create index if not exists link_clicks_handle_idx
  on link_clicks (handle, created_at desc);

alter table profile_views enable row level security;
alter table link_clicks enable row level security;
-- No policies: these are read through the server after it has checked that
-- the caller owns the handle.

-- Daily series for one handle, zero-filled so a quiet day is a gap in the
-- chart rather than a missing bar.
create or replace function handle_stats(p_handle text, p_days integer default 30)
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

-- Click totals per link, for the breakdown under the chart.
create or replace function handle_link_stats(p_handle text, p_days integer default 30)
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

-- Both functions run as the caller, so the row level security above still
-- applies; only the service_role key, used after an ownership check, gets past
-- it. Execute is withdrawn from the public roles so they cannot even try.
revoke all on function handle_stats(text, integer) from public;
revoke all on function handle_link_stats(text, integer) from public;
