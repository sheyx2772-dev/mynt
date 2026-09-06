-- Kim ko'rdi.

-- name: RecordVisit :exec
-- One row per pair, moved forward. Nothing is written for a reader who asked
-- to be invisible: the condition is on the insert, so there is no state in
-- which the row exists and the check is somewhere else.
insert into profile_visits (handle, viewer_user_id)
select sqlc.arg(handle), sqlc.arg(viewer_id)
where not exists (
  select 1 from viewer_settings s where s.user_id = sqlc.arg(viewer_id) and s.korinmas
)
on conflict (handle, viewer_user_id) do update
  set last_at = now(), soni = profile_visits.soni + 1;

-- name: Viewers :many
-- The owner's list. Ownership is the join: a number that is not the
-- reader's yields no rows.
select v.viewer_user_id, v.last_at, v.soni,
       viewer.normalized as viewer_handle, viewer.owner_name as viewer_name, viewer.avatar_url as viewer_avatar
from profile_visits v
join handles owner on owner.normalized = v.handle and owner.user_id = sqlc.arg(owner_id)
left join handles viewer on viewer.user_id = v.viewer_user_id and viewer.status = 'claimed'
where v.handle = sqlc.arg(handle)
order by v.last_at desc
limit sqlc.arg(page_size)::int;

-- name: CountViewers :one
select count(*) from profile_visits v
join handles owner on owner.normalized = v.handle and owner.user_id = sqlc.arg(owner_id)
where v.handle = sqlc.arg(handle)
  and v.last_at >= now() - (sqlc.arg(days)::int * interval '1 day');

-- name: IsInvisible :one
select coalesce((select korinmas from viewer_settings where user_id = sqlc.arg(user_id)), false)::bool;

-- name: SetInvisible :exec
insert into viewer_settings (user_id, korinmas)
values (sqlc.arg(user_id), sqlc.arg(korinmas))
on conflict (user_id) do update set korinmas = excluded.korinmas, updated_at = now();

-- name: ForgetVisits :exec
-- Going invisible also takes back what was already written: the promise is
-- "nobody sees me", not "nobody sees me from now on".
delete from profile_visits where viewer_user_id = sqlc.arg(user_id);
