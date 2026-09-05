-- Sessions, and the links that create them.
--
-- Identity lives in `auth.users`, which the website already authenticates
-- against. Creating an account is therefore not a statement here — it goes
-- through Supabase's admin API, the same door `landing/src/lib/auth/telegram-login.ts`
-- uses — and everything below takes a user id that already exists.

-- name: CreateSession :one
insert into flex_sessions (user_id, token_hash, expires_at, user_agent, ip)
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
update flex_sessions s
set last_used_at = now()
from auth.users u
where s.token_hash = sqlc.arg(token_hash)
  and s.expires_at > now()
  and u.id = s.user_id
returning s.id as session_id, s.expires_at, u.id as user_id, u.email;

-- name: DeleteSession :exec
delete from flex_sessions where token_hash = sqlc.arg(token_hash);

-- Signing out everywhere. The reason this table exists rather than a JWT.
-- name: DeleteUserSessions :exec
delete from flex_sessions where user_id = sqlc.arg(user_id);

-- name: DeleteExpiredSessions :execrows
delete from flex_sessions where expires_at < now();

-- name: CreateLoginToken :one
insert into flex_login_tokens (email, token_hash, expires_at, ip)
values (lower(sqlc.arg(email)::text), sqlc.arg(token_hash), sqlc.arg(expires_at), sqlc.narg(ip))
returning *;

-- Spending a sign-in link.
--
-- The read and the write are one statement so the link cannot be used twice,
-- however many requests arrive at once: the second `update` matches no row
-- because the first has already set `consumed_at`.
-- name: ConsumeLoginToken :one
update flex_login_tokens
set consumed_at = now()
where token_hash = sqlc.arg(token_hash)
  and consumed_at is null
  and expires_at > now()
returning *;

-- name: CountRecentLoginTokens :one
select count(*) from flex_login_tokens
where email = lower(sqlc.arg(email)::text)
  and created_at > now() - sqlc.arg(window_seconds)::int * interval '1 second';

-- The second window: one source may only ask for so many links an hour, however
-- many addresses it tries. Counted separately from the per-address limit
-- because they stop different things — one protects a person from being mailed
-- a hundred times, the other protects the sending reputation from a script.
-- name: CountRecentLoginTokensByIP :one
select count(*) from flex_login_tokens
where ip = sqlc.arg(ip)
  and created_at > now() - sqlc.arg(window_seconds)::int * interval '1 second';

-- Housekeeping. Spent and expired links are of no use to anybody, and their
-- rows are the only place an address appears before an account exists.
-- name: DeleteExpiredLoginTokens :execrows
delete from flex_login_tokens
where expires_at < now() - interval '1 day';

-- The password door. See `internal/auth/password.go` for why the hash is slow.

-- name: PasswordFor :one
select p.hash, u.id as user_id, u.email
from flex_passwords p
join auth.users u on u.id = p.user_id
where lower(u.email) = lower(sqlc.arg(email)::text);

-- name: SetPassword :exec
insert into flex_passwords (user_id, hash) values (sqlc.arg(user_id), sqlc.arg(hash))
on conflict (user_id) do update set hash = excluded.hash, updated_at = now();

-- name: CountRecentPasswordAttempts :one
select count(*) from flex_password_attempts
where (email = lower(sqlc.narg(email)::text) or ip = sqlc.narg(ip))
  and created_at > now() - sqlc.arg(window_seconds)::int * interval '1 second';

-- A refused attempt is counted too, or the limit measures how often somebody
-- stopped trying.
-- name: RecordPasswordAttempt :exec
insert into flex_password_attempts (email, ip, succeeded)
values (lower(sqlc.narg(email)::text), sqlc.narg(ip), sqlc.arg(succeeded));
