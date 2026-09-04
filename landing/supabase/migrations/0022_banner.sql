-- Flex migration 0022 — the owner's own cover on the card.
--
-- The banner currently shows the artwork of the catalogue design a buyer chose.
-- A company with its own photography or its own brand wants that space, and it
-- is the most visible thing on the profile — which makes it the right thing to
-- put behind the subscription rather than the profile picture, which stays
-- free for everyone because a card with no face on it is not a card.

alter table handles add column if not exists banner_url text
  check (banner_url is null or banner_url ~ '^https://');
