-- Everything the sign-in flow does, as statements rather than as a query
-- builder. sqlc reads this file and writes the Go that calls it.

-- name: CreateUser :one
insert into users (email)
values (lower(sqlc.arg(email)::text))
returning *;

-- name: UserByEmail :one
select * from users where email = lower(sqlc.arg(email)::text);

-- name: UserByID :one
select * from users where id = sqlc.arg(id);

-- name: MarkEmailVerified :exec
update users set email_verified_at = now()
where id = sqlc.arg(id) and email_verified_at is null;

-- name: CreateSession :one
insert into sessions (user_id, token_hash, expires_at, user_agent, ip)
values (sqlc.arg(user_id), sqlc.arg(token_hash), sqlc.arg(expires_at), sqlc.narg(user_agent), sqlc.narg(ip))
returning *;

-- The whole of "who is this request from", in one statement.
--
-- An expired session is not returned rather than being returned and checked in
-- Go: two places that decide what "still valid" means will eventually disagree,
-- and the one that is wrong is the one that lets somebody in. `last_used_at`
-- moves in the same statement, so a read cannot succeed without recording that
-- it happened.
-- name: TouchSession :one
update sessions s
set last_used_at = now()
from users u
where s.token_hash = sqlc.arg(token_hash)
  and s.expires_at > now()
  and u.id = s.user_id
returning s.id as session_id, s.expires_at,
          u.id as user_id, u.email, u.email_verified_at, u.telegram_id;

-- name: DeleteSession :exec
delete from sessions where token_hash = sqlc.arg(token_hash);

-- Signing out everywhere. The reason the sessions table exists.
-- name: DeleteUserSessions :exec
delete from sessions where user_id = sqlc.arg(user_id);

-- name: DeleteExpiredSessions :execrows
delete from sessions where expires_at < now();

-- name: CreateLoginToken :one
insert into login_tokens (email, token_hash, expires_at, ip)
values (lower(sqlc.arg(email)::text), sqlc.arg(token_hash), sqlc.arg(expires_at), sqlc.narg(ip))
returning *;

-- Spending a sign-in link.
--
-- The read and the write are one statement so the link cannot be used twice,
-- however many requests arrive at once: the second `update` matches no row
-- because the first has already set `consumed_at`.
-- name: ConsumeLoginToken :one
update login_tokens
set consumed_at = now()
where token_hash = sqlc.arg(token_hash)
  and consumed_at is null
  and expires_at > now()
returning *;

-- name: CountRecentLoginTokens :one
select count(*) from login_tokens
where email = lower(sqlc.arg(email)::text)
  and created_at > now() - sqlc.arg(window_seconds)::int * interval '1 second';
