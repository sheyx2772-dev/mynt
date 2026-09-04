-- The assistant's note about a contact list, kept rather than recomputed.
--
-- Measured on the vendor this project uses: a real briefing prompt takes tens
-- of seconds and sometimes minutes, and the fast model answers 503 under load.
-- Nothing that slow can happen while a page renders, so the note is written
-- when the owner asks for one and read instantly from here afterwards.
--
-- One row per handle, not a history. Nobody wants last Tuesday's briefing; they
-- want this morning's, and a table that grows a row per press is a table that
-- has to be pruned by somebody.
--
-- There is no "enable AI" flag anywhere, deliberately. A briefing is only ever
-- written because the owner pressed the button, which makes asking for one the
-- consent — and deleting the row is how it is withdrawn. A default-on setting
-- for sending other people's contact notes to a model vendor is not a default
-- this product gets to choose on somebody's behalf.

create table if not exists network_briefs (
  handle_id uuid primary key references handles (id) on delete cascade,
  summary text not null check (char_length(summary) <= 4000),
  -- [{ ref, why, draft, contact_id }] — resolved on the way in, so a briefing
  -- read back never has to be matched against the list a second time.
  suggestions jsonb not null default '[]'::jsonb,
  -- What it was looking at, so the screen can say when it has gone stale.
  contacts_seen integer not null default 0 check (contacts_seen >= 0),
  built_at timestamptz not null default now()
);

alter table network_briefs enable row level security;

-- The same door as leads: the owner of the handle, and nobody else. The note
-- summarises other people's personal data and is not public in any sense.
drop policy if exists briefs_owner_reads on network_briefs;
create policy briefs_owner_reads on network_briefs
  for select
  using (
    exists (
      select 1 from handles h
      where h.id = network_briefs.handle_id
        and h.user_id = auth.uid()
    )
  );

-- Writes go through the service role from a server action, as everywhere else
-- here: no policy grants insert or update to a signed-in user directly.
