-- Flex migration 0025 — the company's own fields on its staff's cards.
--
-- Blinq's business tier locks the logo, the colours and the contact details and
-- lets the team personalise the rest, and a change to a locked field syncs to
-- every profile at once. That is the actual reason a firm buys the team plan
-- rather than twenty personal ones: twenty people cannot be relied on to type
-- the company name the same way, and when the office moves, twenty profiles are
-- wrong until twenty people fix them.
--
-- So these live on the company and are read through to every card it holds. The
-- member never types them and cannot get them wrong.

alter table teams add column if not exists logo_url text
  check (logo_url is null or logo_url ~ '^https://');

alter table teams add column if not exists website text
  check (website is null or website ~ '^https://');

alter table teams add column if not exists city text
  check (city is null or char_length(city) <= 60);
