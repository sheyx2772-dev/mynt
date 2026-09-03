-- The contacts a card collects become a list the owner works.
--
-- 0021 built the collecting half: somebody taps a card, leaves their name and a
-- way to answer, and the owner gets a notification. That is where it stopped.
-- A row with a name and a phone is a record of a meeting, not a relationship —
-- there was nowhere to write what was agreed, no way to mark who has been
-- answered, and nothing that could tell an owner on Monday which four people
-- are still waiting on them from last week.
--
-- These columns are the owner's side of each row. The visitor's own `note` is
-- left exactly as they typed it; everything added here belongs to whoever owns
-- the number.

-- Where they are in the owner's own pipeline.
--
-- Four states, because five is a system somebody has to be taught and three
-- cannot tell "wrote back" from "became a customer". 'new' is what a tap
-- produces, and it is the only one the application sets by itself.
alter table leads add column if not exists status text not null default 'new';

alter table leads drop constraint if exists leads_status_check;
alter table leads
  add constraint leads_status_check
  check (status in ('new', 'talking', 'client', 'cold'));

-- The owner's own note, kept apart from the visitor's.
--
-- Overwriting what somebody typed about themselves with what you thought of
-- them afterwards loses the only sentence in the row they chose.
alter table leads add column if not exists owner_note text
  check (owner_note is null or char_length(owner_note) <= 2000);

-- When to come back to them, and when they were last spoken to.
--
-- A date rather than a timestamp: "Thursday" is how anybody actually plans a
-- follow-up, and an hour on it would be a precision nobody means.
alter table leads add column if not exists follow_up_on date;
alter table leads add column if not exists last_touch_at timestamptz;

-- The owner's labels. Same shape as handles.tags, and the same ceiling: past
-- five they stop being labels and become a second note.
alter table leads add column if not exists tags text[] not null default '{}';

alter table leads drop constraint if exists leads_tags_check;
alter table leads
  add constraint leads_tags_check
  check (cardinality(tags) <= 5);

-- A contact can now be entered by the owner as well as arriving from a tap.
--
-- The list is only worth working if it is the whole list, and a networking
-- product that ignores the person whose number you took on paper is a product
-- that gets kept alongside a notebook instead of replacing it.
alter table leads drop constraint if exists leads_source_check;
alter table leads
  add constraint leads_source_check
  check (source is null or source in ('nfc', 'qr', 'share', 'manual', 'import'));

-- The two questions the list is asked, and the only two orders it is read in:
-- who is overdue, and who has never been answered.
create index if not exists leads_follow_up_idx
  on leads (handle_id, follow_up_on)
  where follow_up_on is not null;

create index if not exists leads_status_idx
  on leads (handle_id, status, created_at desc);

-- Answering somebody is what moves the clock, so the clock is not left to the
-- application to remember. Any move out of 'new', and any note written about
-- them, counts as having dealt with them.
create or replace function flex_stamp_touch() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status and new.status <> 'new' then
    new.last_touch_at := now();
  elsif new.owner_note is distinct from old.owner_note
        and new.owner_note is not null then
    new.last_touch_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists leads_stamp_touch on leads;
create trigger leads_stamp_touch
  before update on leads
  for each row
  execute function flex_stamp_touch();
