-- Flex migration 0040 — the phone on the counter.
--
-- Requests were readable only through the cabinet, which means only by the
-- person who bought the number. In a real dining room that person is not the
-- one watching a screen: the waiter is, and the waiter has no reason to hold
-- the owner's account. So the chain ended one step short — a guest pressed a
-- button, a notice was recorded, and nobody was looking.
--
-- A venue therefore gets one secret address. The owner opens it once on the
-- till phone and leaves it open; there is no sign-in, because a shared password
-- on a shared phone is a password written on the wall. If the staff change, or
-- the link travels somewhere it should not, the owner replaces it and the old
-- one stops working the same second.
--
-- What that address can do is deliberately small: read this venue's requests and
-- mark one done. Not the menu, not the profile, not the other numbers on the
-- account.

alter table venues
  add column if not exists staff_token text;

alter table venues drop constraint if exists venues_staff_token_len;
alter table venues add constraint venues_staff_token_len
  check (staff_token is null or char_length(staff_token) between 24 and 64);

-- Unique so a lookup by token can never return two venues, and indexed because
-- every load of the counter screen is that lookup.
create unique index if not exists venues_staff_token_key
  on venues (staff_token)
  where staff_token is not null;

comment on column venues.staff_token is
  'Secret in the counter link. Rotating it revokes every phone that had the old one.';
