-- Flex migration 0035 — signing in through Telegram.
--
-- Email was the only door, and it is the wrong one for this market: Click,
-- Uzum and Payme all sign people in by phone, and ordinary buyers here do not
-- check email. SMS costs money per message; Telegram is already on the phone,
-- costs nothing, and the bot exists.
--
-- The code is issued by us and carried to the bot by a deep link, rather than
-- issued by the bot: at sign-in time we do not know who the person is yet, so
-- there is no account to send a message to. They tap a link, Telegram sends
-- `/start <code>` for them, and we learn which chat answered.
--
-- While it lives, the code is a bearer secret — whoever sends it to the bot
-- becomes whoever signs in with it. So it is short-lived, single-use, and
-- rate limited by address on the way in.

create table if not exists telegram_logins (
  -- Six characters from an alphabet with no O/0 and no I/1, because this is
  -- read off one screen and typed into another.
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),

  -- Filled in when the bot hears from somebody. Null until then, which is what
  -- "still waiting" means.
  chat_id bigint,
  display_name text check (display_name is null or char_length(display_name) <= 120),

  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  -- Set the moment it is exchanged for a session. A second attempt finds it
  -- already spent.
  consumed_at timestamptz,

  -- Kept only to rate limit issuing, and only until the row expires.
  ip text
);

create index if not exists telegram_logins_expiry_idx on telegram_logins (expires_at);
create index if not exists telegram_logins_ip_idx on telegram_logins (ip, created_at desc);

-- A chat that answers two codes at once would be ambiguous about which sign-in
-- it meant, so the newest wins and the older stays unanswered until it expires.
create index if not exists telegram_logins_chat_idx
  on telegram_logins (chat_id)
  where chat_id is not null;

alter table telegram_logins enable row level security;

-- No policy at all. A live code is a credential and nothing in a browser has
-- any business reading this table; every read and write goes through the
-- server, which holds the service role.
