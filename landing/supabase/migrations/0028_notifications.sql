-- Flex migration 0028 — telling people things.
--
-- The channel is not the feature. A lead arriving, a subscription running out
-- and a handle being transferred are all the same shape of event, and each of
-- them has to reach somebody through whatever they actually read. Building "a
-- Telegram bot" would mean rewriting all of it when the phone app ships.
--
-- So the notification is a row, and delivery is separate. The row is the record:
-- the app's own notification list will read this table, an owner who read it on
-- Telegram sees it marked read, and a channel that fails leaves the notice
-- intact rather than losing it.

create table if not exists notifications (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- What happened. Constrained, because a typo'd kind is a notice that renders
  -- as nothing and is never noticed.
  kind text not null check (kind in ('lead', 'plan_expiring', 'plan_expired', 'transfer')),
  handle text,
  title text not null check (char_length(title) between 1 and 120),
  body text check (body is null or char_length(body) <= 500),
  -- Where it points when tapped, inside the site.
  href text check (href is null or href ~ '^/'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on notifications (user_id, created_at desc);

-- Unread count, which every inbox needs and nothing else should scan for.
create index if not exists notifications_unread_idx
  on notifications (user_id) where read_at is null;

alter table notifications enable row level security;

-- A person reads and dismisses their own. Writing is the server's job, since
-- the events come from things other people did.
drop policy if exists notifications_own_reads on notifications;
create policy notifications_own_reads on notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_own_updates on notifications;
create policy notifications_own_updates on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Where a person wants to be reached, and the state of linking them.
--
-- One row per account rather than per handle: a person holding three numbers
-- wants one Telegram thread, not three.
create table if not exists notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Telegram's own chat id, set once the person messages the bot.
  telegram_chat_id bigint unique,
  -- The single-use code the person sends the bot to prove who they are.
  telegram_link_code text unique,
  telegram_link_expires_at timestamptz,
  -- Off by default for nothing: an owner who has not linked anything still
  -- gets the notification row, they just do not get it pushed anywhere.
  lead_alerts boolean not null default true,
  plan_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_settings enable row level security;

drop policy if exists notification_settings_own on notification_settings;
create policy notification_settings_own on notification_settings
  for select using (user_id = auth.uid());

-- The link code is a bearer secret for the duration it lives: anyone who sends
-- it to the bot becomes that account's Telegram. It is short-lived, single-use,
-- and never selectable by the anon key.
revoke all on notification_settings from anon;
grant select (user_id, telegram_chat_id, lead_alerts, plan_alerts)
  on notification_settings to authenticated;
