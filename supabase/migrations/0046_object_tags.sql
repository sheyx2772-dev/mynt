-- A tag on a thing, and the message a stranger leaves against it.
--
-- The object tags this shop already sells — the car tag, the pet tag, the one
-- for keys — all opened the owner's profile, and for an object that is the
-- wrong screen. Somebody standing at a blocked-in car does not want to read
-- your service prices; they want to say "you have blocked me in" and leave.
-- Somebody holding a found dog wants to reach whoever lost it, once, now.
--
-- So an object gets its own address and its own screen. What passes between the
-- two people is a message and nothing else: the owner's number is never shown
-- to the finder, and the finder's is shown only if they choose to leave one.
-- The alternative, which half of Tashkent already practises, is writing a phone
-- number on the windscreen and collecting spam with it.
--
-- One-way for now. "Your car is blocking me" needs no reply — it needs the
-- owner to come down. Where an answer is the point, the sender can leave their
-- own way of being reached, and that is their decision rather than ours.

create table if not exists object_tags (
  id uuid primary key default gen_random_uuid(),
  handle_id uuid not null references handles (id) on delete cascade,
  -- Long enough not to be guessed by walking the alphabet. Anybody standing at
  -- the object can read it off the tag; nobody at home can reach it.
  token text not null unique check (char_length(token) between 24 and 64),
  kind text not null check (kind in ('car', 'pet', 'thing')),
  -- What the owner calls it, for their own list: "Malibu", "Rex", "kalitlar".
  -- Never shown to the stranger — a dog's name is how a stranger sounds like
  -- somebody who knows you.
  label text check (label is null or char_length(trim(label)) between 1 and 60),
  -- Retired rather than deleted: a tag is glued to a windscreen, and a message
  -- arriving from a car that was sold should stop rather than 404.
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists object_tags_handle_idx on object_tags (handle_id, created_at desc);

alter table object_tags enable row level security;

drop policy if exists tags_owner_reads on object_tags;
create policy tags_owner_reads on object_tags
  for select
  using (
    exists (
      select 1 from handles h
      where h.id = object_tags.handle_id and h.user_id = auth.uid()
    )
  );

create table if not exists tag_messages (
  id bigserial primary key,
  tag_id uuid not null references object_tags (id) on delete cascade,
  -- What happened, from a short list. A stranger at a car in the rain is not
  -- going to compose a sentence, and the four that matter cover almost all of
  -- it — the free text is for the fifth.
  kind text not null check (kind in ('blocking', 'lights', 'damage', 'found', 'other')),
  body text check (body is null or char_length(body) <= 500),
  -- How to reach the sender, if the sender wants to be reached. Optional by
  -- design: the point of this table is that neither side has to give a number.
  reply_to text check (reply_to is null or char_length(trim(reply_to)) between 5 and 60),
  -- Roughly where, when the sender offered it. A car is found by its street,
  -- not its coordinates, so this is text as typed rather than a point.
  place text check (place is null or char_length(place) <= 200),
  ip text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tag_messages_tag_idx on tag_messages (tag_id, created_at desc);

-- The rate limit reads by address and time, and only ever for the last hour.
create index if not exists tag_messages_ip_idx on tag_messages (ip, created_at desc);

alter table tag_messages enable row level security;

drop policy if exists tag_messages_owner_reads on tag_messages;
create policy tag_messages_owner_reads on tag_messages
  for select
  using (
    exists (
      select 1 from object_tags t
      join handles h on h.id = t.handle_id
      where t.id = tag_messages.tag_id and h.user_id = auth.uid()
    )
  );

-- Writes go through the service role from a server action, as everywhere else
-- here: the sender is a stranger with no account and no session.

alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in (
    'lead', 'plan_expiring', 'plan_expired', 'transfer', 'venue_request',
    'device_order', 'tag_message'
  ));
