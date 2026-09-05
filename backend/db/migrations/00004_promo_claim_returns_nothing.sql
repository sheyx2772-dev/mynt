-- `claim_promo_code` said "no" by returning a row of nulls.
--
-- A function declared `returns promo_codes` always returns exactly one row. When
-- its update matches nothing, that row is every column null — not zero rows —
-- so the caller reads a successful query whose fields are all empty rather than
-- the "nothing to claim" it was written to express. In Go that is a scan error
-- into non-nullable fields, which surfaced as a 500 for somebody typing a code
-- that does not exist.
--
-- `returns setof promo_codes` returns the rows the update touched: one when the
-- code may be used, none when it may not. Which is what every caller already
-- assumed, and what `pgx.ErrNoRows` is for.
--
-- Found by typing a code that was never created.

-- +goose Up

-- The return type changes, so the old one goes first.
drop function if exists claim_promo_code(text, text, bigint);

-- +goose StatementBegin
create function claim_promo_code(p_code text, p_kind text, p_amount bigint)
returns setof promo_codes
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

-- +goose Down

drop function if exists claim_promo_code(text, text, bigint);
