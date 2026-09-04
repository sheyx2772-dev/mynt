-- Flex migration 0011 — three artwork-backed card designs.
--
-- 0009 closed the design set at the database level so a stored value can never
-- be a design the renderer cannot draw. That constraint has to widen before an
-- owner can choose one of the new ones, or the update fails with 23514.
--
-- The artwork carries no handle, URL or wordmark: those are printed over it at
-- render time, so one image serves every owner who picks the design.

alter table handles drop constraint if exists handles_card_design_check;

alter table handles
  add constraint handles_card_design_check
  check (card_design in (
    'genesis', 'lime', 'grid', 'sheen', 'naqsh', 'paper',
    'rahbar', 'devops', 'suzani'
  ));
