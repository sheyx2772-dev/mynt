-- Sovg'a stikerlar: a sticker bought for somebody, shown on their profile.
--
-- The network people arrive from sells these, and they are the one social
-- thing here that is also revenue. A gift is an order of a fourth kind — it
-- goes through the same providers, the same settlement and the same refund
-- path as a number, a subscription and a device — and the gift itself is a
-- row written when the money lands, not when the order is placed. Deleting
-- that row is what a refund does; the order stays as the record.
--
-- The catalogue and the prices are in Go (orders/gifts.go), like device
-- prices: an amount that arrives with an order is an amount the buyer chose.
-- The column only says which sticker, so a stored value the renderer does
-- not know is drawn as the fallback rather than refused here.

-- +goose Up

alter table orders drop constraint if exists orders_kind_check;
alter table orders
  add constraint orders_kind_check
  check (kind in ('handle', 'subscription', 'device', 'gift'));

alter table orders drop constraint if exists orders_months_check;
alter table orders
  add constraint orders_months_check
  check (
    (kind in ('handle', 'device', 'gift') and months is null)
    or (kind = 'subscription' and months is not null and months in (1, 12))
  );

alter table orders add column if not exists sticker text;
alter table orders add column if not exists gift_note text
  check (gift_note is null or char_length(gift_note) <= 140);

alter table orders drop constraint if exists orders_sticker_check;
alter table orders
  add constraint orders_sticker_check
  check (
    (kind = 'gift' and sticker is not null)
    or (kind <> 'gift' and sticker is null)
  );

create table if not exists gifts (
  id bigserial primary key,
  order_id uuid not null unique references orders (id) on delete cascade,
  -- The recipient's number. A gift outlives the sender's account, so the
  -- sender is nullable and the profile shows "Mehmon" for a closed one.
  handle text not null,
  from_user_id uuid references auth.users (id) on delete set null,
  sticker text not null,
  note text not null default '',
  -- The owner may take one off the shelf without it being un-given.
  korsatiladi boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists gifts_handle_idx on gifts (handle, created_at desc);

-- The notice a delivered gift raises.
alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('lead', 'plan_expiring', 'plan_expired', 'transfer', 'venue_request',
                  'device_order', 'tag_message', 'greeting', 'gift'));

-- +goose Down

drop table if exists gifts;
alter table orders drop constraint if exists orders_sticker_check;
alter table orders drop column if exists gift_note;
alter table orders drop column if exists sticker;
alter table orders drop constraint if exists orders_months_check;
alter table orders
  add constraint orders_months_check
  check (
    (kind in ('handle', 'device') and months is null)
    or (kind = 'subscription' and months is not null and months in (1, 12))
  );
alter table orders drop constraint if exists orders_kind_check;
alter table orders
  add constraint orders_kind_check
  check (kind in ('handle', 'subscription', 'device'));
alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('lead', 'plan_expiring', 'plan_expired', 'transfer', 'venue_request',
                  'device_order', 'tag_message', 'greeting'));
