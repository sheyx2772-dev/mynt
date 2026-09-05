-- A phone number that is not necessarily Uzbek.
--
-- 00006 wrote `phone ~ '^998[0-9]{9}$'`, which is true today and is a migration
-- and a data rewrite the first time somebody signs up from Almaty. The country
-- is not a property of the schema; it is a property of this month.
--
-- Stored as E.164 without the plus, which is the only form that is unambiguous
-- across countries: the country code is part of the number, so +998 90 123 45
-- 67 and +7 701 123 45 67 cannot collide however they were typed. Between eight
-- and fifteen digits is what E.164 allows, and a leading zero is not a country
-- code — a number that starts with one was written for a local dialling plan
-- and has not been normalised.
--
-- `country` is kept beside it rather than derived on read. Dial codes are
-- variable length — 1, 7, 44, 998 — so working out the country from the digits
-- needs a prefix table, and the moment to do that is when the number is parsed
-- and the caller already knows. Null means we accepted a number we could not
-- place, which is honest: it can still receive a message if a provider covers
-- it, and it should not be silently labelled.

-- +goose Up

alter table flex_phone_codes drop constraint if exists flex_phone_codes_phone_check;
alter table flex_phone_codes
  add constraint flex_phone_codes_phone_check check (phone ~ '^[1-9][0-9]{7,14}$');

alter table flex_phones drop constraint if exists flex_phones_phone_check;
alter table flex_phones
  add constraint flex_phones_phone_check check (phone ~ '^[1-9][0-9]{7,14}$');

-- ISO 3166-1 alpha-2, upper case. Two letters, so a typo is a constraint
-- violation rather than a row nobody can group by.
alter table flex_phones
  add column if not exists country text check (country is null or country ~ '^[A-Z]{2}$');

-- Everything on file today came in through the Uzbek-only check above.
update flex_phones set country = 'UZ' where country is null and phone like '998%';

create index if not exists flex_phones_country_idx on flex_phones (country);

-- The claim function's signature does not change, but it was created against
-- the old row type and is recreated so it sees the new one.
-- +goose StatementBegin
create or replace function claim_phone_code(p_phone text, p_hash bytea)
returns setof flex_phone_codes
language sql
as $$
  update flex_phone_codes
  set consumed_at = now()
  where phone = p_phone
    and code_hash = p_hash
    and consumed_at is null
    and expires_at > now()
    and attempts < 3
  returning *;
$$;
-- +goose StatementEnd

-- +goose Down

drop index if exists flex_phones_country_idx;
alter table flex_phones drop column if exists country;
alter table flex_phones drop constraint if exists flex_phones_phone_check;
alter table flex_phone_codes drop constraint if exists flex_phone_codes_phone_check;
