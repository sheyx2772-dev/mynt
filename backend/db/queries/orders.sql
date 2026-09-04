-- Buying a number.
--
-- A number is reserved while an order is paid for and only becomes claimed
-- when a provider confirms. The reservation is an ordinary row in `handles`
-- with `status = 'reserved'`, which means it reuses the unique index on
-- `normalized` — and that index, not any code, is what stops two buyers taking
-- the same number when their orders race.

-- What somebody typing a number into the app needs to know: whether it can be
-- bought. Deliberately returns the row rather than a boolean, because a
-- reserved number that nobody paid for is available again and only the row
-- says when.
-- name: HandleState :one
select normalized, status, reserved_until from handles
where normalized = sqlc.arg(normalized);

-- A reservation nobody paid for must not hold a number forever. Cleared
-- immediately before an insert attempt rather than only by a sweep, so a buyer
-- is never told a number is taken by an order that expired an hour ago.
-- name: ClearExpiredReservation :execrows
delete from handles
where normalized = sqlc.arg(normalized)
  and status = 'reserved'
  and reserved_until < now();

-- Taking a number off the market.
--
-- `price_paid` is written here from the price this server computed, so a later
-- change to the pricing rules cannot alter what an already-placed order was
-- for. A duplicate raises 23505 against the unique index, which is the race
-- being lost and is reported as "already taken".
-- name: ReserveHandle :one
insert into handles (letters, digits, status, user_id, owner_name, price_paid, reserved_until)
values (sqlc.arg(letters), sqlc.arg(digits), 'reserved', sqlc.arg(user_id),
        sqlc.narg(owner_name), sqlc.arg(price), sqlc.arg(reserved_until))
returning *;

-- Without a payment provider configured the number is claimed outright, which
-- is what development and a preview deployment want — and what the website
-- already does, so the two cannot disagree about it.
-- name: ClaimHandleOutright :one
insert into handles (letters, digits, status, user_id, owner_name, price_paid, claimed_at)
values (sqlc.arg(letters), sqlc.arg(digits), 'claimed', sqlc.arg(user_id),
        sqlc.narg(owner_name), sqlc.arg(price), now())
returning *;

-- name: CreateOrder :one
insert into orders (user_id, handle, amount)
values (sqlc.arg(user_id), sqlc.arg(handle), sqlc.arg(amount))
returning *;

-- The ownership filter is the authorization: somebody else's order is no rows.
-- name: OrderForUser :one
select * from orders
where id = sqlc.arg(id) and user_id = sqlc.arg(user_id);

-- name: OrdersForUser :many
select * from orders
where user_id = sqlc.arg(user_id)
order by created_at desc
limit 50;

-- Claims are cheap to attempt and expensive to undo, so they are counted twice:
-- per account, which stops one person hoarding, and per source, which stops one
-- script driving many throwaway accounts.
-- name: CountRecentClaimsByUser :one
select count(*) from claim_attempts
where user_id = sqlc.arg(user_id)
  and created_at > now() - sqlc.arg(window_seconds)::int * interval '1 second';

-- name: CountRecentClaimsByIP :one
select count(*) from claim_attempts
where ip = sqlc.arg(ip)
  and created_at > now() - sqlc.arg(window_seconds)::int * interval '1 second';

-- A refused attempt is recorded too, so hammering the limit does not reset it.
-- name: RecordClaimAttempt :exec
insert into claim_attempts (user_id, ip, handle, succeeded)
values (sqlc.narg(user_id), sqlc.narg(ip), sqlc.arg(handle), sqlc.arg(succeeded));
