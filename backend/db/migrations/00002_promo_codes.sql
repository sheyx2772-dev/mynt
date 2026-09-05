-- Promo codes.
--
-- One table for every kind of order, because a code that works on a number and
-- not on a subscription is two systems and two admin screens — and the second
-- one is always the one that goes stale. What a code applies to is a column.
--
-- Three shapes of discount, because they answer different questions. A
-- percentage is what a campaign announces. A fixed sum is what a person
-- understands. And free months are what a subscription actually wants — the
-- price does not move, the expiry does.
--
-- The counter is the part that has to be right. A code with a hundred uses that
-- somebody reads, checks, and then increments is a code that goes to a hundred
-- and four when four people press the button together. It is incremented by a
-- conditional update instead, and the row it returns is the permission — if no
-- row comes back, the code is spent and there is nothing to argue with.

-- +goose Up

create table if not exists promo_codes (
  -- Typed by a person off a poster, so stored in one case and compared in one
  -- case. The check is what stops "Yoz2026" and "YOZ2026" being two codes.
  code text primary key
    check (code = upper(code) and code ~ '^[A-Z0-9-]{3,32}$'),

  kind text not null check (kind in ('percent', 'amount', 'months')),

  -- Per kind: a percentage of the price, a number of so'm, or a number of
  -- months. One column because it is one number, and three would leave two
  -- of them null on every row.
  value integer not null check (value > 0),
  constraint promo_percent_is_a_percentage
    check (kind <> 'percent' or value between 1 and 100),

  -- A percentage of a number that costs a hundred and twenty million is
  -- twenty-four million, which is not what anybody meant by "twenty per cent
  -- off". Null means no ceiling, and a percentage code without one is a
  -- deliberate decision rather than an oversight.
  max_discount bigint check (max_discount is null or max_discount > 0),

  -- Which kinds of order it works on. An array rather than a row per kind, so
  -- one code is one row and "everything" is the default.
  applies_to text[] not null default '{handle,subscription,device,venue}'
    check (applies_to <@ array['handle','subscription','device','venue']
           and array_length(applies_to, 1) > 0),

  -- Null means unlimited. `used_count` is moved only by the conditional update
  -- in `redeem_promo_code`, never by application code.
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),

  once_per_account boolean not null default true,

  -- Stops a code meant for a real purchase being spent on the cheapest number
  -- in the namespace.
  min_amount bigint check (min_amount is null or min_amount > 0),

  starts_at timestamptz,
  expires_at timestamptz,
  constraint promo_window_is_a_window
    check (starts_at is null or expires_at is null or starts_at < expires_at),

  -- A switch that is not a deletion. A spent campaign is a record of what was
  -- given away, and deleting the code would delete the reason a hundred orders
  -- were cheaper than the price list.
  active boolean not null default true,

  -- What campaign this is, for whoever reads the table in six months.
  note text check (note is null or char_length(note) <= 200),

  created_at timestamptz not null default now()
);

create index if not exists promo_codes_active_idx on promo_codes (active, expires_at);

-- Who used what, and what it actually took off.
--
-- The discount is frozen here rather than recomputed later: the code may be
-- edited or switched off afterwards, and what a person was charged must not
-- change when it is.
create table if not exists promo_redemptions (
  id bigserial primary key,
  code text not null references promo_codes (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references orders (id) on delete set null,

  -- So'm taken off, or months granted. Both zero is a bug, and the check says
  -- so rather than letting a free redemption through.
  discount bigint not null default 0 check (discount >= 0),
  months integer not null default 0 check (months >= 0),
  constraint promo_redemption_gave_something check (discount > 0 or months > 0),

  created_at timestamptz not null default now()
);

create index if not exists promo_redemptions_code_idx on promo_redemptions (code, created_at desc);

-- One account, one use — for the codes that ask for it.
--
-- A partial unique index rather than a check in Go: two requests arriving
-- together both read "not used yet" and both write, and only an index stops
-- the second one.
create unique index if not exists promo_redemptions_once_idx
  on promo_redemptions (code, user_id)
  where true;

-- Claiming a use.
--
-- Returns the row when the code may be used and nothing when it may not, which
-- makes "is it still valid" and "take one" a single statement. Everything it
-- checks is checked here rather than in Go, because between a check in Go and a
-- write in Postgres there is a gap, and the gap is where a code with one use
-- left gets used twice.
-- +goose StatementBegin
create function claim_promo_code(p_code text, p_kind text, p_amount bigint)
returns promo_codes
language sql
as $$
  update promo_codes set used_count = used_count + 1
  where code = upper(p_code)
    and active
    and (max_uses is null or used_count < max_uses)
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
    and p_kind = any(applies_to)
    and (min_amount is null or p_amount >= min_amount)
  returning *;
$$;
-- +goose StatementEnd

-- Giving a use back, for a purchase that did not complete. Floored at zero so a
-- double release cannot make a spent code available again.
-- +goose StatementBegin
create function release_promo_code(p_code text) returns void
language sql
as $$
  update promo_codes set used_count = greatest(used_count - 1, 0)
  where code = upper(p_code);
$$;
-- +goose StatementEnd

-- +goose Down

drop function if exists release_promo_code(text);
drop function if exists claim_promo_code(text, text, bigint);
drop table if exists promo_redemptions;
drop table if exists promo_codes;
