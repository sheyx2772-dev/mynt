-- Who somebody is, and how they stay signed in.
--
-- The first migration of the backend that owns its own database. Until now
-- identity came from Supabase's `auth` schema, which meant the rule for what a
-- session is lived in somebody else's product and could only be read from a
-- dashboard. It lives here now.
--
-- Two decisions are worth stating, because both look like extra work until the
-- day they are not:
--
-- A session token is stored **hashed**. What the browser or the phone holds is
-- a long random string; what this table holds is its SHA-256. A dump of this
-- database — a backup on somebody's laptop, a log that printed a row — hands
-- over nobody's session, because the column cannot be replayed. Hashing needs
-- no salt here for the same reason a password does: the input is 32 bytes of
-- entropy, not a word a person chose, so there is nothing to guess.
--
-- And the token is opaque rather than a JWT. A JWT is checked without asking
-- the database, which is exactly why it cannot be withdrawn: a stolen one stays
-- valid until it expires, and "sign out everywhere" needs a list of the ones
-- that no longer count — which is this table, arrived at the long way round.
-- One round trip per request buys the ability to end a session in the moment
-- somebody asks for it.

-- +goose Up

create table users (
  id uuid primary key default gen_random_uuid(),

  -- Addresses are compared as written by nobody: stored lowercase and checked,
  -- so `Aziz@Example.com` and `aziz@example.com` cannot become two accounts.
  email text not null unique
    check (email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  -- Set the first time a sign-in link is followed. Null means the address was
  -- offered but never proved, which is the state a half-finished sign-up
  -- leaves behind.
  email_verified_at timestamptz,

  -- Telegram sign-in, when it is used. Nullable and unique: an account may
  -- have one, and no two accounts may share it.
  telegram_id bigint unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,

  -- sha256 of the token the client holds. Never the token itself.
  token_hash bytea not null unique check (octet_length(token_hash) = 32),

  expires_at timestamptz not null,
  created_at timestamptz not null default now(),

  -- Moved on use, so a stale session can be told from an abandoned one and so
  -- a person can be shown where they are signed in.
  last_used_at timestamptz not null default now(),

  -- What asked. Kept short and treated as a label, not as evidence: both are
  -- supplied by the client and neither is trusted for anything.
  user_agent text check (user_agent is null or char_length(user_agent) <= 400),
  ip inet
);

create index sessions_user_idx on sessions (user_id, last_used_at desc);
-- Expired rows are deleted on a schedule; this is the index that sweep reads.
create index sessions_expiry_idx on sessions (expires_at);

-- A sign-in link, which is a password that lasts fifteen minutes.
--
-- Hashed for the same reason a session is, and single-use: `consumed_at` is set
-- in the same statement that reads the row, so a link forwarded to somebody
-- else, or replayed from a mail scanner that followed it first, is spent.
create table login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),

  -- Counted per address and per source so a script cannot mail somebody a
  -- hundred sign-in links, which is a way of attacking a person rather than
  -- the server.
  ip inet
);

create index login_tokens_email_idx on login_tokens (email, created_at desc);
create index login_tokens_expiry_idx on login_tokens (expires_at);

-- goose splits a file on semicolons, so a function body full of them has to be
-- marked as one statement.
-- +goose StatementBegin
create function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
-- +goose StatementEnd

create trigger users_touch_updated_at
  before update on users
  for each row execute function touch_updated_at();

-- +goose Down

drop trigger if exists users_touch_updated_at on users;
drop function if exists touch_updated_at();
drop table if exists login_tokens;
drop table if exists sessions;
drop table if exists users;
