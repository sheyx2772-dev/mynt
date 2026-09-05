-- The public directory.
--
-- Only claimed numbers appear anywhere here. A reservation is an unfinished
-- purchase rather than a resident, and an unclaimed number is a price quote —
-- there are 17.5M of those, and listing them would bury the people.

-- name: Residents :many
-- Ordered by what has been looked at, because the directory is browsed rather
-- than searched: somebody arriving with no name in mind should meet the
-- profiles that are actually used.
select normalized, owner_name, bio, avatar_url, city, tags, view_count, last_seen_at
from handles
where status = 'claimed'
  and (sqlc.narg(term)::text is null
    or normalized  ilike '%' || sqlc.narg(term)::text || '%'
    or owner_name  ilike '%' || sqlc.narg(term)::text || '%'
    or city        ilike '%' || sqlc.narg(term)::text || '%')
order by view_count desc nulls last, claimed_at desc
limit sqlc.arg(page_size)::int;

-- name: NewestResidents :many
-- A nameless profile is a number somebody bought and has not filled in. It is
-- a resident, but it is not one to lead with.
select normalized, owner_name, bio, avatar_url, city, tags, view_count, last_seen_at
from handles
where status = 'claimed' and owner_name is not null and owner_name <> ''
order by claimed_at desc
limit sqlc.arg(page_size)::int;

-- name: CountResidents :one
select count(*) from handles where status = 'claimed';

-- name: TopHandles :many
-- Most looked at over the last few days, which is not the same as most looked
-- at ever: the point is to show what is alive now.
select h.normalized, h.owner_name, h.avatar_url, count(v.id)::bigint as views
from handles h
join profile_views v on v.handle = h.normalized
where h.status = 'claimed'
  and v.created_at > now() - (sqlc.arg(days)::int * interval '1 day')
group by h.normalized, h.owner_name, h.avatar_url
order by views desc
limit sqlc.arg(page_size)::int;

-- name: ClaimedHandles :many
-- Everything the sitemap lists. Not paged: it is one file, generated whole,
-- and a crawler asks for it rarely.
select normalized, updated_at from handles
where status = 'claimed'
order by claimed_at desc
limit 10000;
