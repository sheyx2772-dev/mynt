-- Mynt migration 0009 — card designs.
--
-- Every design is drawn by this project. Nothing here reproduces a mark that
-- belongs to somebody else: a card carrying a licensed brand is an
-- infringement the moment it is sold, and it is also not a differentiator,
-- since anyone can copy a logo. The genesis serial cannot be copied.

alter table handles add column if not exists card_design text not null default 'genesis';

-- The set is closed at the database level so a design can never be a value
-- the renderer does not know how to draw.
alter table handles drop constraint if exists handles_card_design_check;
alter table handles
  add constraint handles_card_design_check
  check (card_design in ('genesis', 'lime', 'grid', 'sheen', 'naqsh', 'paper'));
