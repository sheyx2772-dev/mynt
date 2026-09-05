-- Promo codes.
--
-- Claiming a use is one statement — `claim_promo_code` — and not a read
-- followed by a write. Between reading "ninety-nine used of a hundred" and
-- writing "a hundred" there is a gap, and four people pressing the button
-- together all read ninety-nine.

-- name: ClaimPromoCode :one
select * from claim_promo_code(sqlc.arg(code)::text, sqlc.arg(kind)::text, sqlc.arg(amount)::bigint);

-- Giving a use back, for a purchase that did not complete.
-- name: ReleasePromoCode :exec
select release_promo_code(sqlc.arg(code)::text);

-- Whether this account has used this code before. Asked only for the codes that
-- say once per account; the unique index is what actually enforces it, and this
-- is so somebody is told rather than seeing a failed insert.
-- name: HasRedeemedPromo :one
select exists (
  select 1 from promo_redemptions
  where code = upper(sqlc.arg(code)::text) and user_id = sqlc.arg(user_id)
);

-- The flag is copied from the code rather than passed in: a partial index
-- cannot read another table, and what a code was when somebody used it is a
-- fact about that use — editing the code afterwards must not change it.
-- name: RecordPromoRedemption :exec
insert into promo_redemptions (code, user_id, order_id, discount, months, once_per_account)
select upper(sqlc.arg(code)::text), sqlc.arg(user_id), sqlc.narg(order_id),
       sqlc.arg(discount), sqlc.arg(months), c.once_per_account
from promo_codes c where c.code = upper(sqlc.arg(code)::text);

-- The panel.

-- name: CountPromoCodes :one
select count(*) from promo_codes;

-- name: PromoCodes :many
select c.*, (select count(*) from promo_redemptions r where r.code = c.code)::bigint as redeemed
from promo_codes c
-- Live codes first, newest first within each: the one somebody is looking for
-- is almost always one they just made.
order by c.active desc, c.created_at desc
limit sqlc.arg(page_size)::int offset sqlc.arg(skip)::int;

-- name: CreatePromoCode :one
insert into promo_codes (code, kind, value, max_discount, applies_to, max_uses,
                         once_per_account, min_amount, starts_at, expires_at, note)
values (upper(sqlc.arg(code)::text), sqlc.arg(kind), sqlc.arg(value), sqlc.narg(max_discount),
        sqlc.arg(applies_to), sqlc.narg(max_uses), sqlc.arg(once_per_account),
        sqlc.narg(min_amount), sqlc.narg(starts_at), sqlc.narg(expires_at), sqlc.narg(note))
returning *;

-- Switched off rather than deleted. A spent campaign is the record of why a
-- hundred orders were cheaper than the price list.
-- name: SetPromoCodeActive :exec
update promo_codes set active = sqlc.arg(active) where code = upper(sqlc.arg(code)::text);
