-- Flex migration 0042 — telling a venue before its tables go quiet.
--
-- 0041 gave a venue an expiry and made the call button stop at it. Nothing told
-- anybody it was coming, so the first version of that gate punished the
-- customer: one morning the button is gone from every table and the owner finds
-- out from a waiter, or from a guest. That is not a subscription lapsing, it is
-- us breaking their dining room without warning.
--
-- Two notices, because they are different events. Seven days out is a warning
-- somebody can act on. The day it lapses is a fact — the buttons are already
-- gone — and it is the one that gets a venue back, so it is sent even though
-- the warning was.
--
-- Both are recorded against the expiry they were sent for rather than as a
-- flag, so paying moves the expiry and earns a fresh set next period instead of
-- silencing the venue forever.

alter table venues
  add column if not exists plan_reminded_for timestamptz,
  add column if not exists plan_expired_told_for timestamptz;

create or replace function venues_needing_plan_reminder(days integer)
returns table (venue_id uuid, handle text, user_id uuid, name text, expires_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select v.id, h.normalized, h.user_id, v.name, v.plan_expires_at
  from venues v
  join handles h on h.id = v.handle_id
  where h.user_id is not null
    and v.plan_expires_at > now()
    and v.plan_expires_at <= now() + (days || ' days')::interval
    and (v.plan_reminded_for is null or v.plan_reminded_for <> v.plan_expires_at)
  order by v.plan_expires_at;
$$;

-- A window rather than "expired", so a run that misses a day catches up, and a
-- venue that lapsed in March is not told about it every morning since.
create or replace function venues_just_expired(days integer)
returns table (venue_id uuid, handle text, user_id uuid, name text, expires_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select v.id, h.normalized, h.user_id, v.name, v.plan_expires_at
  from venues v
  join handles h on h.id = v.handle_id
  where h.user_id is not null
    and v.plan_expires_at <= now()
    and v.plan_expires_at > now() - (days || ' days')::interval
    and (v.plan_expired_told_for is null or v.plan_expired_told_for <> v.plan_expires_at)
  order by v.plan_expires_at;
$$;

-- Conditional on the expiry still being the one being recorded, so a payment
-- that lands mid-run is not silenced by it.
create or replace function mark_venue_reminded(target uuid, for_expiry timestamptz)
returns void
language sql
security definer
set search_path = public
as $$
  update venues set plan_reminded_for = for_expiry
  where id = target and plan_expires_at = for_expiry;
$$;

create or replace function mark_venue_expired_told(target uuid, for_expiry timestamptz)
returns void
language sql
security definer
set search_path = public
as $$
  update venues set plan_expired_told_for = for_expiry
  where id = target and plan_expires_at = for_expiry;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'venues_needing_plan_reminder(integer)',
    'venues_just_expired(integer)',
    'mark_venue_reminded(uuid, timestamptz)',
    'mark_venue_expired_told(uuid, timestamptz)'
  ] loop
    execute format('revoke execute on function %s from public', fn);
    execute format('revoke execute on function %s from anon', fn);
    execute format('revoke execute on function %s from authenticated', fn);
  end loop;
end $$;
