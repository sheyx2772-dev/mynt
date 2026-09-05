-- "One account, one use" applied to every code, including the ones that did
-- not ask for it.
--
-- 00002 created the index as
--
--   create unique index promo_redemptions_once_idx
--     on promo_redemptions (code, user_id) where true;
--
-- `where true` reads like "a partial index that always applies", which is a way
-- of saying it is not partial at all. So a code meant to be used a hundred
-- times by anybody could be used once per person — and the second attempt was
-- a unique violation surfacing as a 500 rather than a refusal.
--
-- The condition belongs to the code, and a partial index cannot read another
-- table. So the flag is copied onto the redemption when it is written, which is
-- correct for a second reason: what a code was when somebody used it is a fact
-- about that use, and editing the code afterwards must not change it.
--
-- Found by making a code repeatable and using it twice.

-- +goose Up

alter table promo_redemptions
  add column if not exists once_per_account boolean not null default false;

-- Existing rows, if any, take the flag their code carries now. There is no
-- better answer for rows written before the column existed.
update promo_redemptions r
set once_per_account = c.once_per_account
from promo_codes c
where c.code = r.code;

drop index if exists promo_redemptions_once_idx;

create unique index promo_redemptions_once_idx
  on promo_redemptions (code, user_id)
  where once_per_account;

-- +goose Down

drop index if exists promo_redemptions_once_idx;
create unique index promo_redemptions_once_idx on promo_redemptions (code, user_id) where true;
alter table promo_redemptions drop column if exists once_per_account;
