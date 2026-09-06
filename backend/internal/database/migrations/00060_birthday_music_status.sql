-- Three things a profile can carry that make it a person's page rather than
-- a business card: a birthday, a song, and a small emoji beside the name.
--
-- The birthday is the one that does something. On the day, the profile wears
-- it, and anybody with an account can leave a greeting — one per person per
-- year, so the unique key is (handle, user_id, yil) and a second tap edits the
-- first rather than stacking. The owner is told on Telegram, the same channel
-- a lead arrives on, because a greeting is somebody in front of the product
-- right now.
--
-- The song and the emoji are the two premium things that need no delivery:
-- the network people arrive from sells exactly these under its premium plan,
-- and the plan here is what the number's owner pays for the page to do more.
-- Gating them is in ReadProfile, not here; the columns are plain.

-- +goose Up

alter table handles
  add column if not exists tugilgan_kun date,
  add column if not exists status_emoji text not null default ''
    check (char_length(status_emoji) <= 8),
  add column if not exists musiqa jsonb not null default '{}'::jsonb;

-- The notice a greeting raises has to pass the kind check, and so do two kinds
-- the Go side has been sending since 00044 that never made it into the list —
-- a paid device order and a tag message were both refused by this constraint
-- and logged, so nobody was told. All of notify.Kind, in one place.
alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('lead', 'plan_expiring', 'plan_expired', 'transfer', 'venue_request',
                  'device_order', 'tag_message', 'greeting'));

create table if not exists greetings (
  id bigserial primary key,
  handle text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  matn text not null default '' check (char_length(matn) <= 140),
  yil integer not null,
  created_at timestamptz not null default now(),
  unique (handle, user_id, yil)
);

create index if not exists greetings_handle_idx on greetings (handle, created_at desc);

-- +goose Down

drop table if exists greetings;
alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('lead', 'plan_expiring', 'plan_expired', 'transfer', 'venue_request'));
alter table handles
  drop column if exists musiqa,
  drop column if exists status_emoji,
  drop column if exists tugilgan_kun;
