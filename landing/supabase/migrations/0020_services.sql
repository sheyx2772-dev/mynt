-- Flex migration 0020 — what the person actually sells.
--
-- A card that carries a name and a phone number tells you who to call. It does
-- not tell you what you would be calling about. For the people this is built
-- for — a lawyer, a dentist, a builder, a photographer — the list of services
-- and what they cost is the reason the card exists at all, and until now there
-- was nowhere to put it except inside the bio.
--
-- Stored as jsonb rather than a child table: a service has no identity of its
-- own, is never queried across profiles, and is always read and written with
-- the profile in one go. A table would buy nothing and cost a join.

alter table handles add column if not exists services jsonb not null default '[]'::jsonb;

-- The shape check goes through a function because a check constraint may not
-- contain a subquery, and validating each item requires unnesting the array.
-- Immutable, so the constraint can use it.
create or replace function flex_services_ok(value jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(value) = 'array'
     and jsonb_array_length(value) <= 8
     and not exists (
       select 1
       from jsonb_array_elements(value) as item
       where jsonb_typeof(item) <> 'object'
          or item->>'name' is null
          or char_length(item->>'name') = 0
          or char_length(item->>'name') > 60
          or char_length(coalesce(item->>'price', '')) > 40
     );
$$;

alter table handles drop constraint if exists handles_services_shape;
alter table handles add constraint handles_services_shape check (flex_services_ok(services));
