-- A password, for the people who open the panel every day.
--
-- The sign-in link stays and is still how an account is created and how one is
-- recovered. This is the faster door for the handful of people who use the
-- panel daily, where waiting for mail every time is friction with no payer.
--
-- Kept in a table of ours rather than in `auth.users`, which belongs to
-- Supabase: a column added to somebody else's schema is a column that
-- disappears when they change it.
--
-- What is stored is an Argon2id hash, not the password and not a SHA of it. A
-- password is a word somebody chose — unlike a session token, it is guessable,
-- so the hash has to be slow on purpose. The parameters live in the encoded
-- string beside each hash, so raising them later does not invalidate the ones
-- already stored.

-- +goose Up

create table if not exists flex_passwords (
  user_id uuid primary key references auth.users (id) on delete cascade,

  -- The full PHC string: algorithm, parameters, salt and hash. One column, so
  -- a hash carries the settings it was made with.
  hash text not null check (hash like '$argon2id$%'),

  updated_at timestamptz not null default now()
);

-- Attempts, counted whether they succeeded or not.
--
-- A password is guessable and this door is worth a great deal, so it is the one
-- place in this system where the limit is tight. Kept separate from the row it
-- would create, so a refused attempt is still counted — otherwise the counter
-- measures how often somebody stopped trying.
create table if not exists flex_password_attempts (
  id bigserial primary key,
  email text,
  ip inet,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists flex_password_attempts_email_idx
  on flex_password_attempts (email, created_at desc);
create index if not exists flex_password_attempts_ip_idx
  on flex_password_attempts (ip, created_at desc);

alter table flex_passwords enable row level security;
alter table flex_password_attempts enable row level security;
revoke all on flex_passwords from anon, authenticated;
revoke all on flex_password_attempts from anon, authenticated;

-- +goose Down

drop table if exists flex_password_attempts;
drop table if exists flex_passwords;
