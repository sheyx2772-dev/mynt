-- What happens around a profile: who looked, who follows, who vouches, who
-- said something, and what the owner posted.
--
-- Every one of these is a join through `handles`, so ownership and visibility
-- are decided in the query rather than checked in Go afterwards.

-- Analitika -----------------------------------------------------------------

-- name: RecordView :exec
insert into profile_views (handle, visitor_hash, referrer_host, source)
values (sqlc.arg(handle), sqlc.narg(visitor_hash), sqlc.narg(referrer_host), sqlc.narg(source));

-- name: BumpViewCount :exec
-- Kept on the handle row so a profile can show it without reading every view.
update handles set view_count = view_count + 1 where normalized = sqlc.arg(handle);

-- name: RecordClick :exec
insert into link_clicks (handle, label, visitor_hash)
values (sqlc.arg(handle), sqlc.arg(label), sqlc.narg(visitor_hash));

-- Obunalar ------------------------------------------------------------------

-- name: IsFollowing :one
select exists (
  select 1 from follows
  where follower_user_id = sqlc.arg(user_id) and followed_handle = sqlc.arg(handle)
);

-- name: Follow :exec
insert into follows (follower_user_id, followed_handle)
values (sqlc.arg(user_id), sqlc.arg(handle))
on conflict do nothing;

-- name: Unfollow :exec
delete from follows
where follower_user_id = sqlc.arg(user_id) and followed_handle = sqlc.arg(handle);

-- name: CountFollowing :one
select count(*) from follows where follower_user_id = sqlc.arg(user_id);

-- name: FollowedHandles :many
select followed_handle from follows where follower_user_id = sqlc.arg(user_id);

-- Tavsiyalar ----------------------------------------------------------------

-- name: IsRecommended :one
select exists (
  select 1 from recommendations r
  join handles h on h.id = r.handle_id
  where h.normalized = sqlc.arg(handle) and r.user_id = sqlc.arg(user_id)
);

-- name: Recommend :exec
insert into recommendations (handle_id, user_id)
select h.id, sqlc.arg(user_id) from handles h where h.normalized = sqlc.arg(handle)
on conflict do nothing;

-- name: Unrecommend :exec
delete from recommendations r
using handles h
where h.id = r.handle_id and h.normalized = sqlc.arg(handle) and r.user_id = sqlc.arg(user_id);

-- name: Recommenders :many
-- Only people who have a claimed number of their own. A recommendation from
-- somebody checkable is worth more than a name, and one from an account with
-- no profile is worth nothing at all.
select rec.normalized, rec.owner_name
from recommendations r
join handles h on h.id = r.handle_id
join handles rec on rec.user_id = r.user_id and rec.status = 'claimed'
where h.normalized = sqlc.arg(handle)
order by r.created_at desc
limit sqlc.arg(page_size)::int;

-- name: CountRecommendations :one
select count(*) from recommendations r
join handles h on h.id = r.handle_id
where h.normalized = sqlc.arg(handle);

-- Izohlar -------------------------------------------------------------------

-- name: Comments :many
-- Closed means closed: no rows rather than rows the page then hides.
select c.id, c.author_id, c.body, c.created_at,
       author.normalized as author_handle, author.owner_name as author_name
from profile_comments c
join handles h on h.id = c.handle_id and h.comments_open
left join handles author on author.user_id = c.author_id and author.status = 'claimed'
where h.normalized = sqlc.arg(handle)
order by c.created_at desc
limit sqlc.arg(page_size)::int;

-- name: AddComment :one
insert into profile_comments (handle_id, author_id, body)
select h.id, sqlc.arg(author_id), sqlc.arg(body)
from handles h
where h.normalized = sqlc.arg(handle) and h.comments_open
returning id;

-- name: DeleteComment :execrows
-- Either the author or the profile's owner may remove one. Both are in the
-- query; nothing is decided afterwards.
delete from profile_comments c
using handles h
where c.handle_id = h.id
  and c.id = sqlc.arg(id)
  and (c.author_id = sqlc.arg(user_id) or h.user_id = sqlc.arg(user_id));

-- Postlar -------------------------------------------------------------------

-- name: PostsForHandle :many
select p.id, p.handle, p.body, p.created_at, h.owner_name, h.avatar_url
from posts p
join handles h on h.normalized = p.handle
where p.handle = sqlc.arg(handle)
order by p.created_at desc
limit sqlc.arg(page_size)::int;

-- name: Feed :many
-- What the numbers somebody follows have posted.
select p.id, p.handle, p.body, p.created_at, h.owner_name, h.avatar_url
from posts p
join handles h on h.normalized = p.handle
join follows f on f.followed_handle = p.handle
where f.follower_user_id = sqlc.arg(user_id)
order by p.created_at desc
limit sqlc.arg(page_size)::int;
