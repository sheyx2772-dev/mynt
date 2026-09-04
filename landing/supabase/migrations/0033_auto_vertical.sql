-- Flex migration 0033 — cars as a fourth vertical.
--
-- A plate on the windscreen is the same shape as a tag on a table: an object
-- somebody taps, an address behind it, and one job that gets done. What makes
-- it worth selling separately is the job — reaching a driver without either
-- side learning the other's number, which is what the paper note under the
-- wiper fails at.
--
-- A fleet counts cars the way a hotel counts rooms, so it needs no new pricing
-- and no new table: only the check constraint has to learn the word.

do $$
begin
  alter table team_requests drop constraint if exists team_requests_vertical_known;

  alter table team_requests
    add constraint team_requests_vertical_known
    check (vertical is null or vertical in ('cafe', 'hotel', 'auto', 'other'));
end $$;
