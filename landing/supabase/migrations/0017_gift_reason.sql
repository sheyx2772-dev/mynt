-- Flex migration 0017 — handles given rather than sold.
--
-- The launch plan hands a small number of complete sets to people whose card
-- gets seen a lot. Those have to be distinguishable from sales: a gift counted
-- as revenue makes the first month's figures a lie, and those figures are what
-- decide what to do next.
--
-- price_paid stays null on a gift, so the reason is what marks it. Null on
-- every handle that was actually bought.

alter table handles add column if not exists gift_reason text
  check (gift_reason is null or char_length(gift_reason) between 3 and 200);

create index if not exists handles_gift_idx
  on handles (claimed_at desc) where gift_reason is not null;
