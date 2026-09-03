-- Devices become something you can actually buy, and something we can post.
--
-- Until now the form factor an owner picked was recorded on the handle as a
-- preference and nothing else followed from it: no money was taken for the
-- object, nobody was told to make one, and there was nowhere to write an
-- address. The device is priced separately from the number by design — see
-- src/lib/plans.ts — and it is the larger half of what has been sold to date,
-- so the shop could take money for a number and not for the thing that carries
-- it.
--
-- This makes a device the third kind of order. It settles through the same
-- conditional update as the other two, so a provider retry stays a no-op.

alter table orders drop constraint if exists orders_kind_check;
alter table orders
  add constraint orders_kind_check
  check (kind in ('handle', 'subscription', 'device'));

alter table orders drop constraint if exists orders_months_check;
-- The `is not null` is not decoration. `months in (1, 12)` against a null is
-- itself null, `true and null` is null, and a CHECK lets null through — so the
-- obvious spelling of this constraint accepts a subscription that says nothing
-- about how long it runs for. Every branch below therefore states presence
-- before it states value. Found by supabase/test/constraints.sql, which is why
-- that file exists.
alter table orders
  add constraint orders_months_check
  check (
    (kind in ('handle', 'device') and months is null)
    or (kind = 'subscription' and months is not null and months in (1, 12))
  );

-- What to make, recorded on the order rather than read off the handle when it
-- ships. An owner may change the form factor on their profile afterwards, and
-- what was paid for is not allowed to change with it.
alter table orders add column if not exists device_type text;

alter table orders drop constraint if exists orders_device_type_check;
alter table orders
  add constraint orders_device_type_check
  check (
    (kind = 'device' and device_type is not null
       and device_type in ('card', 'ring', 'bracelet'))
    or (kind <> 'device' and device_type is null)
  );

-- Which design to print, from the same closed set the renderer can draw. Kept
-- in step with handles_card_design_check in 0012 on purpose: a stored value
-- that no renderer can draw is a card nobody can manufacture.
alter table orders add column if not exists design text;

alter table orders drop constraint if exists orders_design_check;
alter table orders
  add constraint orders_design_check
  check (
    design is null
    or design in (
      'genesis', 'lime', 'grid', 'sheen', 'naqsh', 'paper',
      'rahbar', 'devops', 'suzani', 'xarita'
    )
  );

-- Where to send it. Collected after payment, not before: the price is fixed
-- and delivery is included, so putting four more fields in front of the card
-- reader only loses buyers. The order carries its own recipient rather than
-- reusing the profile, because people buy these as presents.
alter table orders add column if not exists recipient text
  check (recipient is null or char_length(trim(recipient)) between 2 and 80);

alter table orders add column if not exists phone text
  check (phone is null or phone ~ '^[0-9+()\- ]{7,30}$');

alter table orders add column if not exists region text
  check (region is null or char_length(trim(region)) between 2 and 60);

alter table orders add column if not exists address text
  check (address is null or char_length(trim(address)) between 5 and 300);

alter table orders add column if not exists delivery_note text
  check (delivery_note is null or char_length(delivery_note) <= 300);

-- How far along it is.
--
-- A paid device order starts at 'address_needed', which is the state the buyer
-- has to be shown: an order nobody can act on is the one that gets lost. It
-- cannot start at 'queued' because we do not yet know where it goes.
alter table orders add column if not exists fulfilment text;

alter table orders drop constraint if exists orders_fulfilment_check;
alter table orders
  add constraint orders_fulfilment_check
  check (
    (kind = 'device' and fulfilment is not null and fulfilment in (
      'address_needed', 'queued', 'making', 'shipped', 'delivered', 'returned'
    ))
    or (kind <> 'device' and fulfilment is null)
  );

-- An address is what moves an order out of 'address_needed', so the two cannot
-- disagree: past that state the delivery details must all be present.
alter table orders drop constraint if exists orders_address_before_making_check;
alter table orders
  add constraint orders_address_before_making_check
  check (
    kind <> 'device'
    or fulfilment is null
    or fulfilment = 'address_needed'
    or (recipient is not null and phone is not null
        and region is not null and address is not null)
  );

alter table orders add column if not exists shipped_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;

-- The queue whoever makes these works from: paid device orders, oldest first.
create index if not exists orders_fulfilment_idx
  on orders (fulfilment, paid_at)
  where kind = 'device' and status = 'paid';

-- Stamp the moment rather than trusting the caller to. The same reason
-- flex_stamp_done exists on venue_requests: a timestamp the application writes
-- is a timestamp that eventually disagrees with the status beside it.
create or replace function flex_stamp_fulfilment() returns trigger
language plpgsql as $$
begin
  if new.fulfilment = 'shipped' and coalesce(old.fulfilment, '') <> 'shipped' then
    new.shipped_at := now();
  end if;
  if new.fulfilment = 'delivered' and coalesce(old.fulfilment, '') <> 'delivered' then
    new.delivered_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_stamp_fulfilment on orders;
create trigger orders_stamp_fulfilment
  before update on orders
  for each row
  when (new.kind = 'device')
  execute function flex_stamp_fulfilment();
