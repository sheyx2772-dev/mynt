-- Mynt migration 0006 — the public side of a profile.
--
-- Adds what a directory and a leaderboard need: a public view counter, a
-- last-seen stamp, contact details and tags. Analytics stay private; only
-- these aggregates are public, and each is exposed deliberately rather than
-- by opening the underlying tables.

alter table handles add column if not exists city text;
alter table handles add column if not exists contact_email text;
alter table handles add column if not exists tags text[] not null default '{}';
alter table handles add column if not exists last_seen_at timestamptz;

-- Denormalised so a profile page can show its own count from the row it has
-- already loaded. profile_views stays closed: the raw rows carry visitor
-- hashes and referrers, which are nobody's business but the owner's.
alter table handles add column if not exists view_count bigint not null default 0;

create index if not exists handles_view_count_idx on handles (view_count desc);
create index if not exists handles_claimed_idx on handles (claimed_at desc) where status = 'claimed';

-- Called once per recorded view, from the server.
create or replace function increment_view_count(p_handle text)
returns void
language sql
as $$
  update handles set view_count = view_count + 1 where normalized = p_handle;
$$;

revoke all on function increment_view_count(text) from public;

-- The leaderboard needs recent view counts, which live in a table anonymous
-- visitors must not read. SECURITY DEFINER exposes exactly the aggregate and
-- nothing else — no visitor hashes, no referrers, no per-visit rows.
create or replace function top_handles(p_days integer default 3, p_limit integer default 3)
returns table (normalized text, owner_name text, avatar_url text, views bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select h.normalized, h.owner_name, h.avatar_url, count(v.id) as views
  from handles h
  join profile_views v on v.handle = h.normalized
  where h.status = 'claimed'
    and v.created_at >= (current_date - (p_days - 1))
  group by h.normalized, h.owner_name, h.avatar_url
  having count(v.id) > 0
  order by views desc, h.normalized
  limit greatest(p_limit, 0);
$$;

-- This one is meant to be public: it is what the leaderboard renders.
grant execute on function top_handles(integer, integer) to anon, authenticated;
