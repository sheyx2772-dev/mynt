-- Flex migration 0037 — calling a waiter from the table.
--
-- The second half of the menu. Reading it is worth something; being able to
-- ask for the bill without waving is what a guest notices, and it is the one
-- thing a printed menu can never do.
--
-- Every request carries the point it came from, which is the whole reason the
-- table number is in the URL: "somebody wants the bill" is not actionable,
-- "table 7 wants the bill" is.

create table if not exists venue_requests (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,

  -- Table seven, room 214, the till. A string, because it is written on a
  -- sticker by whoever put the stand out and we do not get to choose the
  -- numbering of somebody else's dining room.
  point text check (point is null or char_length(point) <= 12),

  kind text not null check (kind in ('waiter', 'bill', 'review', 'other')),

  -- A review has a rating; the other kinds do not.
  rating smallint check (rating is null or rating between 1 and 5),
  note text check (note is null or char_length(note) <= 500),

  status text not null default 'new' check (status in ('new', 'done')),

  created_at timestamptz not null default now(),
  done_at timestamptz,

  -- Kept to rate limit a guest who presses the button eleven times, and for
  -- nothing else.
  ip text
);

create index if not exists venue_requests_queue_idx
  on venue_requests (venue_id, status, created_at desc);

create index if not exists venue_requests_rate_idx
  on venue_requests (venue_id, point, created_at desc);

-- A request is written by a stranger standing at a table and read by the
-- owner. Neither happens in the browser: the guest posts through a server
-- action and the owner reads through the cabinet, both holding the service
-- role, so nothing here is exposed to anon at all.
alter table venue_requests enable row level security;

-- Done is a timestamp as well as a status, so "how long did table 7 wait" is
-- answerable later without a second table.
create or replace function flex_stamp_done() returns trigger
language plpgsql as $$
begin
  if new.status = 'done' and old.status <> 'done' then
    new.done_at = now();
  elsif new.status = 'new' then
    new.done_at = null;
  end if;
  return new;
end $$;

drop trigger if exists venue_requests_done on venue_requests;
create trigger venue_requests_done before update on venue_requests
  for each row execute function flex_stamp_done();

-- The owner hears about it the way they hear about a lead.
alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('lead', 'plan_expiring', 'plan_expired', 'transfer', 'venue_request'));
