-- Tug'ilgan kun tabriklari.
--
-- Whether a greeting may be left is decided in Go from the date this returns,
-- because "is it their birthday week" is a question about today's date in the
-- owner's time zone, not a fact the row holds.

-- name: GreetingTarget :one
select user_id, owner_name, tugilgan_kun
from handles
where normalized = sqlc.arg(handle) and status = 'claimed';

-- name: Greet :one
-- One per person per year. A second one in the same year replaces the first,
-- so changing your mind about the emoji is not a second notification.
insert into greetings (handle, user_id, emoji, matn, yil)
values (sqlc.arg(handle), sqlc.arg(user_id), sqlc.arg(emoji), sqlc.arg(matn), sqlc.arg(yil))
on conflict (handle, user_id, yil) do update
  set emoji = excluded.emoji, matn = excluded.matn, created_at = now()
returning id, (xmax = 0) as fresh;

-- name: Greetings :many
-- This year's, newest first, with who left it when they have a number of their
-- own. Somebody without one is shown by the name on their account, which the
-- profile they greeted from does not have — so they are "Mehmon".
select g.id, g.emoji, g.matn, g.created_at, g.user_id,
       sender.normalized as sender_handle, sender.owner_name as sender_name, sender.avatar_url as sender_avatar
from greetings g
left join handles sender on sender.user_id = g.user_id and sender.status = 'claimed'
where g.handle = sqlc.arg(handle) and g.yil = sqlc.arg(yil)
order by g.created_at desc
limit sqlc.arg(page_size)::int;

-- name: CountGreetings :one
select count(*) from greetings where handle = sqlc.arg(handle) and yil = sqlc.arg(yil);
