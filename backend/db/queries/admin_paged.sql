-- The panel's lists, with a count beside them.
--
-- Offset paging rather than a cursor. A cursor is right for a feed somebody
-- scrolls forever; this is a table with filters that somebody jumps around in,
-- and it needs a total to draw the pager at all. At this size the offset costs
-- nothing, and when it does the fix is an index rather than a different API.
--
-- The count is a second statement rather than a window function, because
-- `count(*) over ()` is computed per row and the page is fifty rows.

-- name: CountOrders :one
select count(*) from orders
where sqlc.narg(status)::text is null or status = sqlc.narg(status)::text;

-- name: CountHandles :one
select count(*) from handles h
left join auth.users u on u.id = h.user_id
where (sqlc.narg(term)::text is null
    or h.normalized ilike '%' || sqlc.narg(term)::text || '%'
    or h.owner_name ilike '%' || sqlc.narg(term)::text || '%'
    or u.email     ilike '%' || sqlc.narg(term)::text || '%')
  -- Gifts are handles with a reason written on them. Null asks for both.
  and (sqlc.narg(gifts)::bool is null or (h.gift_reason is not null) = sqlc.narg(gifts)::bool);

-- name: AdminHandlesPaged :many
select h.normalized, h.status, h.owner_name, h.plan, h.price_paid, h.gift_reason,
       h.claimed_at, h.view_count, u.email as owner
from handles h
left join auth.users u on u.id = h.user_id
where (sqlc.narg(term)::text is null
    or h.normalized ilike '%' || sqlc.narg(term)::text || '%'
    or h.owner_name ilike '%' || sqlc.narg(term)::text || '%'
    or u.email     ilike '%' || sqlc.narg(term)::text || '%')
  -- Gifts are handles with a reason written on them. Null asks for both.
  and (sqlc.narg(gifts)::bool is null or (h.gift_reason is not null) = sqlc.narg(gifts)::bool)
order by
  case when sqlc.arg(sort)::text = 'raqam'    and     sqlc.arg(descending)::bool then h.normalized end desc nulls last,
  case when sqlc.arg(sort)::text = 'raqam'    and not sqlc.arg(descending)::bool then h.normalized end asc  nulls last,
  case when sqlc.arg(sort)::text = 'egasi'    and     sqlc.arg(descending)::bool then u.email      end desc nulls last,
  case when sqlc.arg(sort)::text = 'egasi'    and not sqlc.arg(descending)::bool then u.email      end asc  nulls last,
  case when sqlc.arg(sort)::text = 'tarif'    and     sqlc.arg(descending)::bool then h.plan       end desc nulls last,
  case when sqlc.arg(sort)::text = 'tarif'    and not sqlc.arg(descending)::bool then h.plan       end asc  nulls last,
  case when sqlc.arg(sort)::text = 'tolangan' and     sqlc.arg(descending)::bool then h.price_paid end desc nulls last,
  case when sqlc.arg(sort)::text = 'tolangan' and not sqlc.arg(descending)::bool then h.price_paid end asc  nulls last,
  case when sqlc.arg(sort)::text = 'olingan'  and     sqlc.arg(descending)::bool then h.claimed_at end desc nulls last,
  case when sqlc.arg(sort)::text = 'olingan'  and not sqlc.arg(descending)::bool then h.claimed_at end asc  nulls last,
  h.claimed_at desc nulls last
limit sqlc.arg(page_size)::int offset sqlc.arg(skip)::int;

-- One order, with everything hanging off it: who bought, what they paid, which
-- provider took it and when, and the promo code if there was one.
-- name: AdminOrder :one
select o.id, o.handle, o.amount, o.kind, o.months, o.status, o.provider,
       o.provider_tx_id, o.created_at, o.paid_at, o.cancelled_at,
       u.email as buyer, u.id as buyer_id,
       -- coalesced rather than left null, because sqlc reads a correlated
       -- subquery as non-null and the scan then fails on the first order that
       -- used no code. Empty and zero mean "no promo", which is what the JSON
       -- tags on the Go side already say.
       coalesce((select r.code from promo_redemptions r where r.order_id = o.id), '')::text as promo_code,
       coalesce((select r.discount from promo_redemptions r where r.order_id = o.id), 0)::bigint as promo_discount
from orders o
left join auth.users u on u.id = o.user_id
where o.id = sqlc.arg(id);

-- What the providers recorded against it. Two tables, one list, because the
-- question is "what happened to this order" and not "what did Payme do".
-- name: AdminOrderTransactions :many
select * from (
  select 'payme' as provider, t.id, t.state::text as state,
         null::timestamptz as prepared_at,
         to_timestamp(t.create_time / 1000.0)::timestamptz as started_at,
         (case when t.perform_time > 0 then to_timestamp(t.perform_time / 1000.0) end)::timestamptz as settled_at,
         (case when t.cancel_time > 0 then to_timestamp(t.cancel_time / 1000.0) end)::timestamptz as ended_at
  from payme_transactions t where t.order_id = sqlc.arg(order_id)
  union all
  select 'click', c.id,
         case when c.completed_at is not null then 'completed'
              when c.cancelled_at is not null then 'cancelled'
              else 'prepared' end,
         c.prepared_at, c.created_at, c.completed_at, c.cancelled_at
  from click_transactions c where c.order_id = sqlc.arg(order_id)
) rows
order by started_at;

-- Customers: who they are, what they hold, and what they have actually paid.
-- name: AdminAccounts :many
-- The ordering is done outside the select rather than inside it: a `case` in
-- an ORDER BY cannot see an output alias, so `handles` and `paid` have to be
-- columns of something before they can be sorted by. Hence the wrapper.
select * from (
  select u.id, u.email, u.created_at as joined,
         p.phone, p.country,
         (select count(*) from handles h where h.user_id = u.id and h.status = 'claimed')::bigint as handles,
         (select coalesce(sum(o.amount), 0) from orders o where o.user_id = u.id and o.status = 'paid')::bigint as paid,
         (select max(o.paid_at) from orders o where o.user_id = u.id and o.status = 'paid')::timestamptz as last_paid
  from auth.users u
  left join flex_phones p on p.user_id = u.id
  where (sqlc.narg(term)::text is null
      or u.email ilike '%' || sqlc.narg(term)::text || '%'
      or p.phone ilike '%' || sqlc.narg(term)::text || '%')
) a
order by
  case when sqlc.arg(sort)::text = 'kim'          and     sqlc.arg(descending)::bool then coalesce(a.phone, a.email) end desc nulls last,
  case when sqlc.arg(sort)::text = 'kim'          and not sqlc.arg(descending)::bool then coalesce(a.phone, a.email) end asc  nulls last,
  case when sqlc.arg(sort)::text = 'raqamlar'     and     sqlc.arg(descending)::bool then a.handles   end desc nulls last,
  case when sqlc.arg(sort)::text = 'raqamlar'     and not sqlc.arg(descending)::bool then a.handles   end asc  nulls last,
  case when sqlc.arg(sort)::text = 'tolagan'      and     sqlc.arg(descending)::bool then a.paid      end desc nulls last,
  case when sqlc.arg(sort)::text = 'tolagan'      and not sqlc.arg(descending)::bool then a.paid      end asc  nulls last,
  case when sqlc.arg(sort)::text = 'oxirgi_tolov' and     sqlc.arg(descending)::bool then a.last_paid end desc nulls last,
  case when sqlc.arg(sort)::text = 'oxirgi_tolov' and not sqlc.arg(descending)::bool then a.last_paid end asc  nulls last,
  case when sqlc.arg(sort)::text = 'qoshilgan'    and     sqlc.arg(descending)::bool then a.joined    end desc nulls last,
  case when sqlc.arg(sort)::text = 'qoshilgan'    and not sqlc.arg(descending)::bool then a.joined    end asc  nulls last,
  a.paid desc, a.joined desc
limit sqlc.arg(page_size)::int offset sqlc.arg(skip)::int;

-- name: CountAccounts :one
select count(*) from auth.users u
left join flex_phones p on p.user_id = u.id
where (sqlc.narg(term)::text is null
    or u.email ilike '%' || sqlc.narg(term)::text || '%'
    or p.phone ilike '%' || sqlc.narg(term)::text || '%');

-- Everything one customer has ever ordered, which is the answer to "kim qachon
-- qancha to'ladi".
-- name: AdminAccountOrders :many
select id, handle, amount, kind, status, provider, created_at, paid_at
from orders where user_id = sqlc.arg(user_id)
order by created_at desc limit 200;
