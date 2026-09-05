-- Notices, and where they are pushed.
--
-- Two tables and one rule between them: the row is written first and the push
-- happens afterwards. A notice recorded but not delivered is one the owner
-- still finds in their cabinet; one delivered but not recorded is gone the
-- moment the message scrolls away.

-- name: RecordNotice :one
insert into notifications (user_id, kind, handle, title, body, href)
values (sqlc.arg(user_id), sqlc.arg(kind), sqlc.narg(handle), sqlc.arg(title),
        sqlc.narg(body), sqlc.narg(href))
returning id;

-- name: NotifySettings :one
select telegram_chat_id, lead_alerts, plan_alerts
from notification_settings where user_id = sqlc.arg(user_id);

-- name: Notices :many
select id, kind, handle, title, body, href, read_at, created_at
from notifications
where user_id = sqlc.arg(user_id)
order by created_at desc
limit sqlc.arg(page_size)::int offset sqlc.arg(skip)::int;

-- name: CountUnread :one
select count(*) from notifications
where user_id = sqlc.arg(user_id) and read_at is null;

-- name: MarkNoticesRead :exec
-- Everything unread, rather than one row: the cabinet shows a list and marking
-- them one at a time is a request per row for a screen somebody has already
-- read all of.
update notifications set read_at = now()
where user_id = sqlc.arg(user_id) and read_at is null;
