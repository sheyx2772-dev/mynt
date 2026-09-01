-- Flex migration 0016 — companies asking for a team order.
--
-- One company ordering twenty cards is twenty users and real money in a single
-- sale, which is a different and easier motion than persuading twenty
-- individuals. The site described the offer and gave nobody a way to ask for
-- it.
--
-- Nothing here is automated. The request is a lead: somebody reads it, calls
-- back and arranges the order by hand. That is correct at this size — a team
-- order needs a conversation about branding, sizes and delivery anyway.

create table if not exists team_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(trim(company)) between 2 and 120),
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 7 and 30),
  email text,
  -- Zero would not be a team and the upper bound is a typo guard, not a limit
  -- on what we would sell.
  team_size integer not null check (team_size between 1 and 100000),
  note text check (note is null or char_length(note) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create index if not exists team_requests_queue_idx
  on team_requests (status, created_at desc);

alter table team_requests enable row level security;

-- No policy at all: a lead list is commercially sensitive and nothing in the
-- browser has any business reading it. Writes go through the server, which
-- holds the service role.
