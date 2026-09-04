-- Flex migration 0023 — paying for the subscription through the same door.
--
-- Premium existed as a column and a price on a page, and could only be switched
-- on by hand. Everything built behind it — the statistics, the contacts
-- collected, the cover, the gold — is worth nothing until somebody can buy it
-- at two in the morning without ringing anyone.
--
-- The order table already carries a handle, an amount and a settlement path
-- through Click and Payme, all of it certified and live. Rather than build a
-- second one, an order now says what it is for. A handle order claims the
-- handle when it settles; a subscription order extends the plan.
--
-- Not recurring: Uzbek providers do card-on-file through a separate tokenised
-- API, and taking a card we cannot cancel would be worse than asking somebody
-- to renew. The order buys a fixed number of months.

alter table orders add column if not exists kind text not null default 'handle';
alter table orders drop constraint if exists orders_kind_check;
alter table orders add constraint orders_kind_check check (kind in ('handle', 'subscription'));

alter table orders add column if not exists months integer;
alter table orders drop constraint if exists orders_months_check;
alter table orders add constraint orders_months_check check (
  (kind = 'handle' and months is null)
  or (kind = 'subscription' and months in (1, 12))
);

-- Extending a plan is done here rather than in application code so the addition
-- is a single statement against the stored value: two payments landing together
-- add two periods instead of both reading the same expiry and overwriting it.
--
-- Renewing early adds to what is left; renewing after a lapse starts from now.
create or replace function extend_premium(target_handle text, add_months integer)
returns void
language sql
security definer
set search_path = public
as $$
  update handles
  set plan = 'premium',
      plan_expires_at = greatest(coalesce(plan_expires_at, now()), now())
        + (add_months || ' months')::interval
  where normalized = target_handle;
$$;

revoke execute on function extend_premium(text, integer) from public;
revoke execute on function extend_premium(text, integer) from anon;
revoke execute on function extend_premium(text, integer) from authenticated;
