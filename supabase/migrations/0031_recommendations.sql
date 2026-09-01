-- Flex migration 0031 — recommendations, and not ratings.
--
-- The competitor has a rating. A rating on a visiting card fails in one of two
-- ways and there is no third:
--
--   Left uncontrolled, one angry client or one competitor puts a 1 on a
--   lawyer's card and it sits under their name for years.
--
--   Made controllable — the way comments here are — it stops being information.
--   An average the owner can switch off when it is bad only ever proves the
--   owner liked it.
--
-- A recommendation has neither problem. It is not an average, so there is
-- nothing to poison; it is positive by construction, so there is nothing to
-- hide. What it says is "these people vouch for this person", which is a claim
-- a card can honestly carry, and the count is the whole of it.
--
-- One tap, no form. That is also the version that belongs in an installed app.

create table if not exists recommendations (
  handle_id uuid not null references handles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (handle_id, user_id)
);

create index if not exists recommendations_handle_idx
  on recommendations (handle_id, created_at desc);

alter table handles add column if not exists recommend_count integer not null default 0;

-- Moved by a trigger rather than by application code, so the count cannot drift
-- from the rows it counts whichever path adds or removes one.
create or replace function bump_recommend_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update handles set recommend_count = recommend_count + 1 where id = new.handle_id;
  elsif tg_op = 'DELETE' then
    update handles set recommend_count = greatest(recommend_count - 1, 0) where id = old.handle_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists recommendations_bump_count on recommendations;
create trigger recommendations_bump_count
  after insert or delete on recommendations
  for each row execute function bump_recommend_count();

alter table recommendations enable row level security;

-- Public, because the count and the names appear on a page anyone can open.
drop policy if exists recommendations_public_read on recommendations;
create policy recommendations_public_read on recommendations for select using (true);

-- Writing goes through the server, where the profile is checked for existing
-- and for not being the caller's own.
revoke insert, update on recommendations from anon, authenticated;

drop policy if exists recommendations_own_delete on recommendations;
create policy recommendations_own_delete on recommendations
  for delete using (user_id = auth.uid());
