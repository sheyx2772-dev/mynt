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

-- Linking an account to a Telegram chat.
--
-- The person asks the site for a code and sends it to the bot. That direction
-- is the only one that works without asking for their phone number: Telegram
-- will not tell us who they are, so they tell Telegram who they are on our
-- behalf. The code is a bearer secret while it lives — short, random,
-- single-use and quick to expire.

-- name: LinkState :one
select telegram_chat_id, telegram_link_code, telegram_link_expires_at
from notification_settings where user_id = sqlc.arg(user_id);

-- name: StartLink :one
-- Replaces any code still outstanding: two live codes for one account is two
-- ways in where there should be one.
insert into notification_settings (user_id, telegram_link_code, telegram_link_expires_at, updated_at)
values (sqlc.arg(user_id), sqlc.arg(code), sqlc.arg(expires_at), now())
on conflict (user_id) do update set
  telegram_link_code = excluded.telegram_link_code,
  telegram_link_expires_at = excluded.telegram_link_expires_at,
  updated_at = now()
returning telegram_link_code, telegram_link_expires_at;

-- name: CompleteLink :one
-- The code is spent by the same statement that accepts it, and only while it is
-- live. A code that has expired matches nothing rather than being checked
-- afterwards in Go, where the gap between the two would be a second window.
update notification_settings set
  telegram_chat_id = sqlc.arg(chat_id),
  telegram_link_code = null,
  telegram_link_expires_at = null,
  updated_at = now()
where telegram_link_code = sqlc.arg(code)
  and telegram_link_expires_at > now()
returning user_id;

-- name: UnlinkTelegram :execrows
update notification_settings set
  telegram_chat_id = null, telegram_link_code = null,
  telegram_link_expires_at = null, updated_at = now()
where user_id = sqlc.arg(user_id);
