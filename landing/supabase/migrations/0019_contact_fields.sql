-- Flex migration 0019 — the fields a business card actually carries.
--
-- A profile had a name, a bio and an email, and no phone number. On a card
-- handed to somebody at a meeting, the phone number is the thing most likely
-- to be used, and calling should be one tap rather than copying digits out of
-- a bio.
--
-- Position and company were being written into the bio because there was
-- nowhere else. Separating them lets the card show them the way a paper card
-- does — under the name, not buried in a sentence — and lets the saved contact
-- carry them into a phone's address book as the fields they are.

alter table handles add column if not exists phone text
  check (phone is null or phone ~ '^[0-9+()\- ]{7,30}$');

alter table handles add column if not exists position text
  check (position is null or char_length(position) <= 80);

alter table handles add column if not exists company text
  check (company is null or char_length(company) <= 80);
