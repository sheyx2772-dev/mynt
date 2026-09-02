-- Flex migration 0038 — a room is not a table.
--
-- The business page has been selling hotels since it was written: an NFC tag by
-- the door, the services behind it, and a way to ask for something without
-- ringing reception. All of that is the cafe machinery with different nouns — a
-- service list is a menu, a room number is a point, and housekeeping is the one
-- request a dining room never makes.

alter table venue_requests drop constraint if exists venue_requests_kind_check;
alter table venue_requests add constraint venue_requests_kind_check
  check (kind in ('waiter', 'bill', 'review', 'clean', 'other'));

comment on column venue_requests.point is
  'Where the request came from, as written on the tag: a table in a cafe, a room in a hotel.';
