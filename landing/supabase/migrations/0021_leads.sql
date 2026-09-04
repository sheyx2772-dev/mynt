-- Flex migration 0021 — the contact coming back the other way.
--
-- Every card so far has been one-directional: the owner hands over their
-- details and hopes the other person writes them down. The whole international
-- market charges for the reverse — Dot calls it "Exchange Contact", Blinq
-- "shared back", and Popl's entire business is built on it — because a card
-- that collects the contact is a card that pays for itself in one meeting.
--
-- These rows are other people's personal data, submitted to one profile owner.
-- They are readable by that owner and by nobody else: no policy grants select
-- to anon, and the owner's own read goes through a policy matched on the
-- handle's user_id.

create table if not exists leads (
  id bigserial primary key,
  handle_id uuid not null references handles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text check (phone is null or phone ~ '^[0-9+()\- ]{7,30}$'),
  email text check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  company text check (company is null or char_length(company) <= 80),
  note text check (note is null or char_length(note) <= 500),
  -- Where the visitor was when they sent it: nfc, qr, share or null.
  source text check (source is null or source in ('nfc', 'qr', 'share')),
  created_at timestamptz not null default now(),

  -- A submission with a name and no way to answer it is not a lead.
  constraint leads_reachable check (phone is not null or email is not null)
);

create index if not exists leads_handle_idx on leads (handle_id, created_at desc);

alter table leads enable row level security;

-- The owner of the handle, and only the owner, may read what was sent to it.
drop policy if exists leads_owner_reads on leads;
create policy leads_owner_reads on leads
  for select
  using (
    exists (
      select 1 from handles h
      where h.id = leads.handle_id
        and h.user_id = auth.uid()
    )
  );

-- Deletion is the owner's too: a person may ask for their details to be
-- removed, and the owner has to be able to do it.
drop policy if exists leads_owner_deletes on leads;
create policy leads_owner_deletes on leads
  for delete
  using (
    exists (
      select 1 from handles h
      where h.id = leads.handle_id
        and h.user_id = auth.uid()
    )
  );

-- No insert policy: submissions arrive through the server action on the
-- service_role key, which is where the rate limiting and validation live. An
-- anon key cannot write here directly.

-- Rate limiting for the public form, kept separate from the row it creates so a
-- refused attempt is still counted.
create table if not exists lead_attempts (
  id bigserial primary key,
  ip text,
  handle text,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lead_attempts_ip_idx on lead_attempts (ip, created_at desc);
create index if not exists lead_attempts_handle_idx on lead_attempts (handle, created_at desc);

alter table lead_attempts enable row level security;
-- No policy: service_role only, as with claim_attempts.
