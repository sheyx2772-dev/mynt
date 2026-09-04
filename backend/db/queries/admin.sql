-- What the company needs to see and do, and cannot do from any customer screen.
--
-- Every one of these replaces a psql session. The person running this business
-- is not a developer, and "run this SQL" has been the answer to giving a number
-- away and to settling an invoice — which means it has often been the answer to
-- nothing happening at all.

-- The numbers on the front page of the panel. One statement rather than five
-- round trips, because it is read on every load.
-- name: AdminOverview :one
select
  (select count(*) from handles where status = 'claimed')::bigint as claimed,
  (select count(*) from handles where status = 'reserved' and reserved_until > now())::bigint as reserved,
  (select count(*) from orders where status = 'pending')::bigint as orders_pending,
  (select count(*) from orders where status = 'paid')::bigint as orders_paid,
  -- What has actually been received, which is not the same as what has been
  -- ordered. Gifts have no order and are excluded by construction.
  (select coalesce(sum(amount), 0) from orders where status = 'paid')::bigint as taken,
  (select count(*) from leads)::bigint as leads;

-- name: AdminOrders :many
select o.id, o.handle, o.amount, o.kind, o.status, o.provider, o.created_at, o.paid_at,
       u.email as buyer
from orders o
left join auth.users u on u.id = o.user_id
where (sqlc.narg(status)::text is null or o.status = sqlc.narg(status)::text)
order by o.created_at desc
limit sqlc.arg(page_size)::int offset sqlc.arg(skip)::int;

-- Searching for a number, by the number itself or by who has it.
-- name: AdminHandles :many
select h.normalized, h.status, h.owner_name, h.plan, h.price_paid, h.gift_reason,
       h.claimed_at, h.view_count, u.email as owner
from handles h
left join auth.users u on u.id = h.user_id
where sqlc.narg(term)::text is null
   or h.normalized ilike '%' || sqlc.narg(term)::text || '%'
   or h.owner_name ilike '%' || sqlc.narg(term)::text || '%'
   or u.email ilike '%' || sqlc.narg(term)::text || '%'
order by h.claimed_at desc nulls last
limit sqlc.arg(page_size)::int;

-- name: AdminUserByEmail :one
select id, email from auth.users where lower(email) = lower(sqlc.arg(email)::text);

-- Handing a number to somebody without a sale.
--
-- Deliberately a separate path from a purchase, and the reason is recorded. A
-- gift that looks like a sale in the numbers makes the first month's figures a
-- lie, and the first month's figures are the ones that decide what to do next.
-- `price_paid` stays null for the same reason.
-- name: AdminGiveHandle :one
insert into handles (letters, digits, status, user_id, owner_name, gift_reason, claimed_at)
values (sqlc.arg(letters), sqlc.arg(digits), 'claimed', sqlc.arg(user_id),
        sqlc.narg(owner_name), sqlc.arg(reason), now())
returning normalized, status, claimed_at;
