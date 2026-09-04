-- Flex migration 0015 — the subscription half of the model.
--
-- The number is bought once, the device is manufactured and sold once, and the
-- platform that answers when someone taps it is paid for monthly. A profile has
-- to stay up for as long as its owner holds the number, so the cost of holding
-- it up does not stop either.
--
-- A handle carries its own plan rather than the account carrying it: an owner
-- may hold several numbers and pay for one of them.

alter table handles add column if not exists plan text not null default 'free';
alter table handles drop constraint if exists handles_plan_check;
alter table handles
  add constraint handles_plan_check check (plan in ('free', 'premium'));

-- Null while on the free plan. When premium lapses this is in the past, and
-- the profile falls back to free limits rather than going dark: the number was
-- paid for and stays reachable.
alter table handles add column if not exists plan_expires_at timestamptz;

create index if not exists handles_plan_expiry_idx
  on handles (plan_expires_at) where plan = 'premium';
