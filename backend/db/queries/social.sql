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

-- Yopiq profil va so'rovlar --------------------------------------------------
--
-- A closed profile takes a request where an open one takes a follow. The
-- decision is one statement in each direction so a refused request can never
-- half-happen: accepting writes the follow and marks the request together.

-- name: IsPrivate :one
select yopiq from handles where normalized = sqlc.arg(handle) and status = 'claimed';

-- name: RequestFollow :one
-- Asks, or reports what was already asked. A refused request is not asked
-- again: the conflict target is the key, and `do update` on a `rad` row
-- leaves it `rad`.
insert into follow_requests (requester_user_id, handle)
values (sqlc.arg(user_id), sqlc.arg(handle))
on conflict (requester_user_id, handle) do update
  set holat = follow_requests.holat
returning holat;

-- name: FollowRequestState :one
select holat from follow_requests
where requester_user_id = sqlc.arg(user_id) and handle = sqlc.arg(handle);

-- name: WithdrawFollowRequest :exec
-- A pending request is taken back; an accepted one is spent, so leaving means
-- asking again next time, the way a private account works elsewhere. Only the
-- refusal stays: that is the owner's record, not the asker's.
delete from follow_requests
where requester_user_id = sqlc.arg(user_id) and handle = sqlc.arg(handle)
  and holat in ('kutilmoqda', 'qabul');

-- name: PendingFollowRequests :many
-- The owner's inbox. Ownership is the join: a number that is not the reader's
-- yields no rows, the same as one with nothing waiting.
select r.requester_user_id, r.created_at,
       asker.normalized as asker_handle, asker.owner_name as asker_name, asker.avatar_url as asker_avatar
from follow_requests r
join handles h on h.normalized = r.handle and h.user_id = sqlc.arg(owner_id)
left join handles asker on asker.user_id = r.requester_user_id and asker.status = 'claimed'
where r.handle = sqlc.arg(handle) and r.holat = 'kutilmoqda'
order by r.created_at desc
limit sqlc.arg(page_size)::int;

-- name: CountPendingFollowRequests :one
select count(*) from follow_requests r
join handles h on h.normalized = r.handle and h.user_id = sqlc.arg(owner_id)
where r.handle = sqlc.arg(handle) and r.holat = 'kutilmoqda';

-- name: DecideFollowRequest :execrows
-- The owner's answer. The ownership filter is the authorization, and only a
-- pending request can be decided — deciding twice matches nothing.
update follow_requests r
set holat = sqlc.arg(holat), decided_at = now()
from handles h
where h.normalized = r.handle and h.user_id = sqlc.arg(owner_id)
  and r.handle = sqlc.arg(handle)
  and r.requester_user_id = sqlc.arg(requester_id)
  and r.holat = 'kutilmoqda';

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

-- name: CountRecentPosts :one
-- A generous ceiling that still stops a script filling the feed.
select count(*) from posts
where user_id = sqlc.arg(user_id) and created_at >= now() - interval '1 hour';

-- name: AddPost :one
-- Only a claimed handle can post: a reservation is an unfinished purchase.
-- Ownership is a condition of the insert, so a guessed handle writes nothing.
insert into posts (handle, user_id, body)
select h.normalized, sqlc.arg(user_id), sqlc.arg(body)
from handles h
where h.normalized = sqlc.arg(handle)
  and h.user_id = sqlc.arg(user_id) and h.status = 'claimed'
returning id, handle;

-- name: DeletePost :one
-- The author filter is the authorization check: somebody else's post simply
-- matches nothing.
delete from posts
where id = sqlc.arg(id) and user_id = sqlc.arg(user_id)
returning handle;
