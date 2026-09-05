-- The daily reminder run.
--
-- A subscription that ends silently is a subscription nobody renews: the gold
-- goes, the statistics close, the call button disappears from every table, and
-- the owner concludes the product broke rather than that they stopped paying.
--
-- The hard part is not the message, it is not sending it every day for the week
-- before expiry. So what was already sent is written down — and written down
-- against the expiry it was sent for, so a renewal earns a fresh reminder next
-- period rather than being permanently silenced.
--
-- Migrations 0029 and 0042 hold the same statements as `security definer`
-- functions, because under Supabase the caller was a Postgres role bound by row
-- level security. This backend connects as the owner and needs no such
-- indirection: the rule is right here, where the run that applies it is.

-- name: HandlesNeedingPlanReminder :many
select h.normalized, h.user_id, h.plan_expires_at
from handles h
where h.plan = 'premium'
  and h.user_id is not null
  and h.plan_expires_at is not null
  and h.plan_expires_at > now()
  and h.plan_expires_at <= now() + make_interval(days => sqlc.arg(days)::int)
  and (h.plan_reminded_for is null or h.plan_reminded_for <> h.plan_expires_at)
order by h.plan_expires_at;

-- name: MarkPlanReminded :exec
-- Conditional on the expiry still being the one being recorded, so a renewal
-- that lands mid-run is not silenced by it.
update handles set plan_reminded_for = sqlc.arg(expires_at)
where normalized = sqlc.arg(handle) and plan_expires_at = sqlc.arg(expires_at);

-- name: VenuesNeedingPlanReminder :many
select v.id, h.normalized, h.user_id, v.name, v.plan_expires_at
from venues v
join handles h on h.id = v.handle_id
where h.user_id is not null
  and v.plan_expires_at > now()
  and v.plan_expires_at <= now() + make_interval(days => sqlc.arg(days)::int)
  and (v.plan_reminded_for is null or v.plan_reminded_for <> v.plan_expires_at)
order by v.plan_expires_at;

-- name: VenuesJustExpired :many
-- A window rather than "expired", so a run that misses a day catches up, and a
-- venue that lapsed in March is not told about it every morning since.
select v.id, h.normalized, h.user_id, v.name, v.plan_expires_at
from venues v
join handles h on h.id = v.handle_id
where h.user_id is not null
  and v.plan_expires_at <= now()
  and v.plan_expires_at > now() - make_interval(days => sqlc.arg(days)::int)
  and (v.plan_expired_told_for is null or v.plan_expired_told_for <> v.plan_expires_at)
order by v.plan_expires_at;

-- name: MarkVenueReminded :exec
update venues set plan_reminded_for = sqlc.arg(expires_at)
where id = sqlc.arg(id) and plan_expires_at = sqlc.arg(expires_at);

-- name: MarkVenueExpiredTold :exec
update venues set plan_expired_told_for = sqlc.arg(expires_at)
where id = sqlc.arg(id) and plan_expires_at = sqlc.arg(expires_at);
