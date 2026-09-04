-- Counting visits without keeping anything that identifies a visitor.

-- name: RecordProfileView :exec
insert into profile_views (handle, visitor_hash, referrer_host, source)
values (sqlc.arg(handle), sqlc.narg(visitor_hash), sqlc.narg(referrer_host), sqlc.narg(source));

-- name: RecordLinkClick :exec
insert into link_clicks (handle, label, visitor_hash)
values (sqlc.arg(handle), sqlc.arg(label), sqlc.narg(visitor_hash));

-- name: IncrementViewCount :exec
select increment_view_count(sqlc.arg(handle));

-- The three reports, as queries rather than as calls to a function.
--
-- In Supabase they were `security definer` functions, because row level
-- security had to be got around: the tables carry visitor hashes and the
-- browser held a key. Neither is true here — the backend is the only thing with
-- a connection, and it checks ownership before it asks — so the wrapper was
-- protecting against a client that no longer exists.
--
-- Written out, they are also typed. sqlc cannot see into a set-returning
-- function and gives back `interface{}`; it reads a plain select completely.

-- Zero-filled, so a quiet day is a gap in the bars rather than a missing one.
-- A chart that silently drops empty days reads as though the quiet period
-- never happened.
-- name: HandleStats :many
with bounds as (
  select (current_date - (sqlc.arg(days)::int - 1)) as first_day
),
days as (
  select generate_series((select first_day from bounds), current_date, interval '1 day')::date as day
),
v as (
  select created_at::date as day, count(*) as n, count(distinct visitor_hash) as u
  from profile_views
  where handle = sqlc.arg(handle)::text and created_at >= (select first_day from bounds)
  group by 1
),
c as (
  select created_at::date as day, count(*) as n
  from link_clicks
  where handle = sqlc.arg(handle)::text and created_at >= (select first_day from bounds)
  group by 1
)
select days.day::date as day,
       coalesce(v.n, 0)::bigint as views,
       coalesce(c.n, 0)::bigint as clicks,
       coalesce(v.u, 0)::bigint as visitors
from days
left join v on v.day = days.day
left join c on c.day = days.day
order by days.day;

-- name: HandleLinkStats :many
select label, count(*)::bigint as clicks
from link_clicks
where handle = sqlc.arg(handle)::text
  and created_at >= (current_date - (sqlc.arg(days)::int - 1))
group by label
order by clicks desc;

-- "togridan" is everything we did not issue a link for: somebody typing the
-- address, or a browser that sent no referrer.
-- name: HandleSourceStats :many
select coalesce(source, 'togridan') as source, count(*)::bigint as views
from profile_views
where handle = sqlc.arg(handle)::text
  and created_at >= (current_date - (sqlc.arg(days)::int - 1))
group by 1
order by 2 desc;
