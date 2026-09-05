-- Signing in with a phone number.
--
-- The door this market actually uses. Click, Uzum and Payme all sign people in
-- by phone, and an ordinary buyer here does not check email — which is why the
-- app asks for a number and not an address.
--
-- SMS costs money per message, and that is the second reason for every limit
-- below. The first is that a code sent to a number is a code sent to a person:
-- a script that can make us send a hundred messages to somebody is a script
-- that can make their phone useless for an evening, and we pay for it.
--
-- Kept apart from `flex_login_tokens`, which carries an address. A phone and an
-- address are different identities that happen to lead to the same account, and
-- one table with both columns half-empty says nothing about which.

-- +goose Up

create table if not exists flex_phone_codes (
  id uuid primary key default gen_random_uuid(),

  -- E.164 without the plus: 998901234567. Stored one way so that +998 90 123
  -- 45 67, 998901234567 and 90 123 45 67 are one number rather than three.
  phone text not null check (phone ~ '^998[0-9]{9}$'),

  -- sha256 of the six digits. A code is short enough to be worth guessing, so
  -- what is stored is not the code — a leaked row is not a way in.
  code_hash bytea not null check (octet_length(code_hash) = 32),

  expires_at timestamptz not null,
  consumed_at timestamptz,

  -- Counted here rather than by deleting the row: a code with three wrong
  -- guesses is spent, and a row that is deleted on the first wrong guess lets
  -- somebody start again by asking for another.
  attempts smallint not null default 0 check (attempts >= 0),

  created_at timestamptz not null default now(),
  ip inet
);

create index if not exists flex_phone_codes_phone_idx
  on flex_phone_codes (phone, created_at desc);
create index if not exists flex_phone_codes_expiry_idx on flex_phone_codes (expires_at);

-- Which account a number belongs to.
--
-- Its own table rather than a column on `auth.users`, which is Supabase's: a
-- column added to somebody else's schema disappears when they change it.
--
-- One number, one account. Without the unique constraint, two people who once
-- shared a SIM are two accounts that can both prove the same number.
create table if not exists flex_phones (
  phone text primary key check (phone ~ '^998[0-9]{9}$'),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  verified_at timestamptz not null default now()
);

alter table flex_phone_codes enable row level security;
alter table flex_phones enable row level security;
revoke all on flex_phone_codes from anon, authenticated;
revoke all on flex_phones from anon, authenticated;

-- Spending a code.
--
-- The read and the write are one statement, so a code cannot be spent twice by
-- two requests arriving together. The attempt counter is checked here too: a
-- code that has been guessed at three times is gone, whatever the fourth guess
-- says.
-- +goose StatementBegin
create function claim_phone_code(p_phone text, p_hash bytea)
returns setof flex_phone_codes
language sql
as $$
  update flex_phone_codes
  set consumed_at = now()
  where phone = p_phone
    and code_hash = p_hash
    and consumed_at is null
    and expires_at > now()
    and attempts < 3
  returning *;
$$;
-- +goose StatementEnd

-- A wrong guess. Counted against the newest live code for that number, because
-- that is the one somebody is typing at.
-- +goose StatementBegin
create function record_phone_guess(p_phone text) returns void
language sql
as $$
  update flex_phone_codes
  set attempts = attempts + 1
  where id = (
    select id from flex_phone_codes
    where phone = p_phone and consumed_at is null and expires_at > now()
    order by created_at desc limit 1
  );
$$;
-- +goose StatementEnd

-- +goose Down

drop function if exists record_phone_guess(text);
drop function if exists claim_phone_code(text, bytea);
drop table if exists flex_phones;
drop table if exists flex_phone_codes;
