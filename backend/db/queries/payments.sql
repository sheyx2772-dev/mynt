-- What the provider protocols read and write.
--
-- Payme identifies a transaction only by its own id after CreateTransaction, so
-- the id → order mapping is a row here and not something that can be recomputed.

-- name: PaymentOrder :one
select id, user_id, handle, amount, status, kind, months, provider
from orders where id = sqlc.arg(id);

-- Settling. Conditional on `pending`, so a provider retry is a no-op: the
-- second call finds nothing to update and changes nothing.
-- name: SettleOrder :one
update orders
set status = 'paid', provider = sqlc.arg(provider), provider_tx_id = sqlc.arg(tx_id),
    paid_at = now()
where id = sqlc.arg(id) and status = 'pending'
returning handle, user_id, kind, months;

-- name: CancelOrder :one
update orders
set status = 'cancelled', cancelled_at = now()
where id = sqlc.arg(id) and status in ('pending', 'paid')
returning handle, user_id, kind, months, status;

-- A reserved number becomes the buyer's. Conditional on the reservation still
-- being theirs, so a payment that arrives after the number was lost changes
-- nothing — and the caller is told, because zero rows is the signal.
-- name: ClaimReservedHandle :execrows
update handles
set status = 'claimed', claimed_at = now(), reserved_until = null
where normalized = sqlc.arg(normalized)
  and user_id = sqlc.arg(user_id)
  and status = 'reserved';

-- name: ReleaseHandle :execrows
delete from handles
where normalized = sqlc.arg(normalized)
  and user_id = sqlc.arg(user_id)
  and status in ('reserved', 'claimed');

-- name: ExtendPremium :exec
select extend_premium(sqlc.arg(target_handle)::text, sqlc.arg(add_months)::int);

-- Whether the number an order is for is still held by its buyer. One question
-- for all three kinds of order, because all three answer it the same way.
-- name: HandleStillHeld :one
select exists (
  select 1 from handles h
  join orders o on o.handle = h.normalized and o.user_id = h.user_id
  where o.id = sqlc.arg(id)
);

-- name: PaymeTransactionByID :one
select id, order_id, amount, state, create_time, perform_time, cancel_time, reason
from payme_transactions where id = sqlc.arg(id);

-- name: PaymeTransactionByOrder :one
select id, order_id, amount, state, create_time, perform_time, cancel_time, reason
from payme_transactions where order_id = sqlc.arg(order_id)
order by create_time desc limit 1;

-- name: CreatePaymeTransaction :exec
insert into payme_transactions (id, order_id, amount, state, create_time)
values (sqlc.arg(id), sqlc.arg(order_id), sqlc.arg(amount), sqlc.arg(state), sqlc.arg(create_time));

-- Zero means "not set by this call", so performing does not wipe a cancel time
-- and cancelling does not wipe a perform time.
-- name: UpdatePaymeTransaction :exec
update payme_transactions set
  state = sqlc.arg(state),
  perform_time = case when sqlc.arg(perform_time)::bigint <> 0 then sqlc.arg(perform_time)::bigint else perform_time end,
  cancel_time = case when sqlc.arg(cancel_time)::bigint <> 0 then sqlc.arg(cancel_time)::bigint else cancel_time end,
  reason = coalesce(sqlc.narg(reason)::smallint, reason)
where id = sqlc.arg(id);

-- name: ClickTransactionByID :one
select id, order_id, amount, prepared_at, completed_at, cancelled_at
from click_transactions where id = sqlc.arg(id);

-- name: CreateClickTransaction :exec
insert into click_transactions (id, order_id, amount, prepared_at)
values (sqlc.arg(id), sqlc.arg(order_id), sqlc.arg(amount), sqlc.narg(prepared_at));

-- name: UpdateClickTransaction :exec
update click_transactions set
  prepared_at = coalesce(sqlc.narg(prepared_at)::timestamptz, prepared_at),
  completed_at = coalesce(sqlc.narg(completed_at)::timestamptz, completed_at),
  cancelled_at = coalesce(sqlc.narg(cancelled_at)::timestamptz, cancelled_at)
where id = sqlc.arg(id);
