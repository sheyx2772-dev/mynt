-- Flex migration 0012 — the Xarita card design.
--
-- Gold engraving on black: the map of Uzbekistan beside a Humo medallion. The
-- medallion is our own heraldic bird, not the state emblem, which the law on
-- the State Emblem does not permit on a product sold to the public.

alter table handles drop constraint if exists handles_card_design_check;

alter table handles
  add constraint handles_card_design_check
  check (card_design in (
    'genesis', 'lime', 'grid', 'sheen', 'naqsh', 'paper',
    'rahbar', 'devops', 'suzani', 'xarita'
  ));
