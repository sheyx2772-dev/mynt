-- Flex migration 0032 — venue enquiries alongside team enquiries.
--
-- A cafe asking for twenty table tags and a company asking for twenty staff
-- cards are the same thing to us: a lead somebody reads, calls back and turns
-- into an order by hand. So this reuses team_requests rather than adding a
-- second table that would need its own notifications, its own queue and its
-- own place in the cabinet.
--
-- What differs is what is being counted. A company counts staff; a venue counts
-- points — tables, rooms, doors, chairs. team_size stops being required and
-- points joins it, with a check that a request carries at least one of the two,
-- so a row that counts nothing still cannot be written.

alter table team_requests
  add column if not exists vertical text,
  add column if not exists points integer;

alter table team_requests
  alter column team_size drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'team_requests_vertical_known'
  ) then
    alter table team_requests
      add constraint team_requests_vertical_known
      check (vertical is null or vertical in ('cafe', 'hotel', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'team_requests_points_sane'
  ) then
    alter table team_requests
      add constraint team_requests_points_sane
      check (points is null or points between 1 and 100000);
  end if;

  -- The row has to be about a countable number of something. Without this,
  -- dropping the NOT NULL above would let a request through that says only
  -- "a company would like something", which nobody can quote against.
  if not exists (
    select 1 from pg_constraint where conname = 'team_requests_size_or_points'
  ) then
    alter table team_requests
      add constraint team_requests_size_or_points
      check (team_size is not null or points is not null);
  end if;
end $$;

create index if not exists team_requests_vertical_idx
  on team_requests (vertical, created_at desc)
  where vertical is not null;
