-- Flex migration 0029 — telling people before it runs out, once.
--
-- A subscription that ends silently is a subscription nobody renews: the gold
-- goes, the statistics close, the contact form disappears, and the owner
-- concludes the product broke rather than that they stopped paying.
--
-- The hard part is not the message, it is not sending it five times. A reminder
-- job that runs daily will see the same handle every day for the week before
-- expiry, so what was already sent has to be written down — and written down
-- against the expiry it was sent for, so a renewal earns a fresh reminder next
-- period rather than being permanently silenced.

alter table handles add column if not exists plan_reminded_for timestamptz;
alter table teams add column if not exists plan_reminded_for timestamptz;

/**
 * Handles whose plan runs out within `days`, that have not been reminded about
 * this particular expiry yet.
 *
 * Returns the owner, because the notification belongs to a person rather than
 * to a number, and the expiry so the message can say when.
 */
create or replace function handles_needing_plan_reminder(days integer)
returns table (normalized text, user_id uuid, expires_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select h.normalized, h.user_id, h.plan_expires_at
  from handles h
  where h.plan = 'premium'
    and h.user_id is not null
    and h.plan_expires_at is not null
    and h.plan_expires_at > now()
    and h.plan_expires_at <= now() + (days || ' days')::interval
    and (h.plan_reminded_for is null or h.plan_reminded_for <> h.plan_expires_at)
  order by h.plan_expires_at;
$$;

revoke execute on function handles_needing_plan_reminder(integer) from public;
revoke execute on function handles_needing_plan_reminder(integer) from anon;
revoke execute on function handles_needing_plan_reminder(integer) from authenticated;

-- Marking one as told. Conditional on the expiry still being the one we are
-- recording, so a renewal that lands mid-run is not silenced by it.
create or replace function mark_plan_reminded(target_handle text, for_expiry timestamptz)
returns void
language sql
security definer
set search_path = public
as $$
  update handles
  set plan_reminded_for = for_expiry
  where normalized = target_handle and plan_expires_at = for_expiry;
$$;

revoke execute on function mark_plan_reminded(text, timestamptz) from public;
revoke execute on function mark_plan_reminded(text, timestamptz) from anon;
revoke execute on function mark_plan_reminded(text, timestamptz) from authenticated;
