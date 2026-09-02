-- Flex migration 0039 — the tables themselves.
--
-- A menu with a request button is worth nothing until it is on the tables, and
-- a cafe with twelve tables needs twelve different tags: the table number lives
-- in the address, so one QR code repeated twelve times makes every request
-- arrive from nowhere.
--
-- The points are a list of labels and nothing else. Requests deliberately store
-- the label as text rather than pointing at a row here, because the label is
-- written on a sticker that outlives any edit: renaming "7" to "Terrasa 3" must
-- not silently rewrite what last week's requests said, and a tag somebody
-- printed and forgot must keep working. So this is an array on the venue, not a
-- table with keys into it.

alter table venues
  add column if not exists points text[] not null default '{}';

alter table venues drop constraint if exists venues_points_count;
alter table venues add constraint venues_points_count
  check (cardinality(points) <= 500);

comment on column venues.points is
  'Labels for the tags: tables in a cafe, rooms in a hotel. Order is print order.';
