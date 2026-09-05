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
--
-- Except while somebody is in the middle of paying for it. Thirty minutes of
-- reservation is measured against a bank transfer that does not always take
-- thirty minutes: a Payme transaction may be held for twelve hours, and a Click
-- prepare sits open until its complete arrives. Deleting the number underneath
-- one of those produced a buyer charged for a number somebody else had by then
-- bought — the payment handlers now refuse that, but refusing it means a real
-- buyer loses a real number, so the reservation is left alone instead.
--
-- The order must still be pending. A settled or cancelled one holds nothing.
-- name: ClearExpiredReservation :execrows
delete from handles h
where h.normalized = sqlc.arg(normalized)
  and h.status = 'reserved'
  and h.reserved_until < now()
  and not exists (
    select 1 from orders o
    where o.handle = h.normalized
      and o.status = 'pending'
      and (
        exists (
          select 1 from payme_transactions t
          where t.order_id = o.id and t.state = 1
        )
        or exists (
          select 1 from click_transactions c
          where c.order_id = o.id
            and c.prepared_at is not null
            and c.completed_at is null
            and c.cancelled_at is null
        )
      )
  );

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


-- Qurilma buyurtmalari -------------------------------------------------------

-- name: DeviceOrders :many
-- What one buyer is waiting for. Cancelled and failed are left out: they are
-- not things anybody is waiting for, and listing them reads as a bill.
select * from orders
where user_id = sqlc.arg(user_id) and kind = 'device'
  and status in ('pending', 'paid')
order by created_at desc
limit 50;

-- name: OwnDeviceOrder :one
select * from orders
where id = sqlc.arg(id) and user_id = sqlc.arg(user_id) and kind = 'device';

-- name: PlaceDeviceOrder :one
-- Ownership is a condition of the insert rather than a check before it, so a
-- guessed handle writes nothing instead of being told it exists.
insert into orders (user_id, handle, amount, kind, device_type, design, fulfilment)
select sqlc.arg(user_id), h.normalized, sqlc.arg(amount), 'device',
       sqlc.arg(device_type), sqlc.narg(design), 'address_needed'
from handles h
where h.normalized = sqlc.arg(handle)
  and h.user_id = sqlc.arg(user_id) and h.status = 'claimed'
returning *;

-- name: SetDeliveryAddress :one
-- The address and the move into the queue are one write. An order that has an
-- address but is still marked as needing one sits in the wrong list forever.
--
-- Only out of address_needed, and only once paid: a buyer who submits the form
-- twice, or edits an address after the parcel is posted, must not pull it back.
update orders set
  recipient = sqlc.arg(recipient), phone = sqlc.arg(phone),
  region = sqlc.arg(region), address = sqlc.arg(address),
  delivery_note = sqlc.narg(delivery_note),
  fulfilment = 'queued', updated_at = now()
where id = sqlc.arg(id) and user_id = sqlc.arg(user_id)
  and kind = 'device' and status = 'paid' and fulfilment = 'address_needed'
returning *;

-- name: DeviceQueue :many
-- What is waiting to be made and posted. Paid only: an unpaid order is not a
-- thing to put in a queue somebody works through. Oldest first, because that is
-- the order they were promised in.
select * from orders
where kind = 'device' and status = 'paid' and fulfilment <> 'delivered'
order by paid_at
limit 200;

-- name: CountDeviceQueue :one
select count(*) from orders
where kind = 'device' and status = 'paid' and fulfilment <> 'delivered';

-- name: AdvanceDeviceOrder :one
-- Conditional on the state that was read, so two people clicking at once move
-- it one step rather than two. shipped_at is stamped by a trigger, not here.
update orders set fulfilment = sqlc.arg(fulfilment), updated_at = now()
where id = sqlc.arg(id) and kind = 'device'
  and fulfilment = sqlc.arg(from_state)
returning *;

-- name: SettleDeviceOrder :one
-- Paying for a device where no provider is configured. Conditional on pending,
-- so this is a no-op the second time exactly as a provider retry is.
update orders set status = 'paid', paid_at = now(), updated_at = now()
where id = sqlc.arg(id) and user_id = sqlc.arg(user_id)
  and kind = 'device' and status = 'pending'
returning *;

-- name: DeviceOrder :one
-- One order without an owner, for the operator's queue.
select * from orders where id = sqlc.arg(id) and kind = 'device';
