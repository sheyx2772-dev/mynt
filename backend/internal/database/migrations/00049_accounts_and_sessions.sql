-- Sessions for the clients that cannot hold a cookie.
--
-- This is the only thing this backend adds to the schema. Everything else it
-- reads — handles, leads, profile_views, link_clicks — is already there,
-- created by the forty-six migrations under `landing/supabase/migrations` and
-- already holding the real data. Recreating any of it here would have produced
-- a second, empty copy of the product: a number bought on the website would not
-- exist in the app.
--
-- Identity is `auth.users`, which Supabase owns and the website already
-- authenticates against. So an account is one account: the same person, the
-- same numbers, whether they signed in on the site with a cookie or in the app
-- with a token. What this backend owns is the session, not the identity.
--
-- Two things are worth stating, because both look like extra work until the day
-- they are not:
--
-- A session token is stored **hashed**. What the app holds is a long random
-- string; what this table holds is its SHA-256. A dump of this database hands
-- over nobody's session, because the column cannot be replayed. No salt and no
-- work factor: the input is 32 bytes of entropy, not a word somebody chose, so
-- there is nothing to guess and making it slow would only make every
-- authenticated request slow.
--
-- And the token is opaque rather than a JWT. A JWT is checked without asking
-- the database, which is exactly why it cannot be withdrawn: a stolen one stays
-- valid until it expires, and "sign out everywhere" needs a list of the ones
-- that no longer count — which is this table, arrived at the long way round.

-- +goose Up

create table if not exists flex_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

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

create index if not exists flex_sessions_user_idx
  on flex_sessions (user_id, last_used_at desc);
-- Expired rows are swept on a schedule; this is the index that sweep reads.
create index if not exists flex_sessions_expiry_idx on flex_sessions (expires_at);

-- A sign-in link, which is a password that lasts fifteen minutes.
--
-- Hashed for the same reason a session is, and single-use: `consumed_at` is set
-- in the same statement that reads the row, so a link forwarded to somebody
-- else, or replayed by a mail scanner that followed it first, is spent.
--
-- No foreign key: a link is issued to an address, and the account may not exist
-- until the link is followed.
create table if not exists flex_login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),

  -- Counted per address and per source, so a script cannot mail somebody a
  -- hundred sign-in links — which is a way of attacking a person rather than
  -- the server.
  ip inet
);

create index if not exists flex_login_tokens_email_idx
  on flex_login_tokens (email, created_at desc);
create index if not exists flex_login_tokens_expiry_idx
  on flex_login_tokens (expires_at);

-- Row level security on both, with no policy at all.
--
-- The anon key is public — it ships in every page the website serves — and
-- these tables are sessions. Nothing but the service role, which lives on this
-- server, may read or write them. Belt and braces alongside the grants below,
-- because the two fail in different ways.
alter table flex_sessions enable row level security;
alter table flex_login_tokens enable row level security;

revoke all on flex_sessions from anon, authenticated;
revoke all on flex_login_tokens from anon, authenticated;

-- +goose Down

drop table if exists flex_login_tokens;
drop table if exists flex_sessions;
