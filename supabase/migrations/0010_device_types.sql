-- Flex migration 0010 — the product is a family, not one card.
--
-- Flex is sold as a card, a ring or a bracelet, all pointing at the same
-- profile. This records which form factor an owner chose.
--
-- Deliberately not a `devices` table yet: that models one person owning
-- several items, which is a fulfilment concern and there are no orders to
-- fulfil. When someone buys a card and a ring together, this column becomes a
-- table and the data moves across in one statement.

alter table handles add column if not exists device_type text not null default 'card';

alter table handles drop constraint if exists handles_device_type_check;
alter table handles
  add constraint handles_device_type_check
  check (device_type in ('card', 'ring', 'bracelet'));
