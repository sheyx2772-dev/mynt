-- Flex migration 0013 — designs made to order.
--
-- A buyer describes the card they want and gets one back. The generator is not
-- called from here yet: image models have no free tier, so for now the request
-- is queued, filled by hand, and the same rows will serve an automated
-- generator later without changing shape.
--
-- The prompt is stored alongside the wish rather than rebuilt when it is
-- filled. Two reasons: the rules that turn a wish into a prompt will change,
-- and a design that came back wrong has to be answerable — you can only ask
-- what was actually sent if it was written down.

create table if not exists design_requests (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  -- Kept beside the handle so a request survives the handle changing hands,
  -- and so ownership can be checked without a join.
  user_id uuid not null references auth.users (id) on delete cascade,
  wish text not null check (char_length(wish) between 3 and 400),
  prompt text not null,
  status text not null default 'pending'
    check (status in ('pending', 'filled', 'refused')),
  -- Where the finished artwork ended up, once there is one.
  image_url text,
  -- Why a request was refused, shown to the buyer. Empty while pending.
  note text,
  created_at timestamptz not null default now(),
  filled_at timestamptz
);

create index if not exists design_requests_queue_idx
  on design_requests (status, created_at);
create index if not exists design_requests_owner_idx
  on design_requests (user_id, created_at desc);

-- One request in flight per handle. Without this a buyer can queue twenty and
-- the queue stops being a queue.
create unique index if not exists design_requests_one_pending_idx
  on design_requests (handle) where status = 'pending';

alter table design_requests enable row level security;

-- A wish is the buyer's own; nobody else has any business reading it. Writes
-- go through the server, which checks the handle is theirs.
drop policy if exists "buyers read their own design requests" on design_requests;
create policy "buyers read their own design requests"
  on design_requests for select
  using (auth.uid() = user_id);

-- A design made for one buyer is not part of the catalogue, so it cannot be a
-- card_design value — that column is a closed set on purpose. It hangs off the
-- handle instead, and takes precedence over the chosen catalogue design when
-- it is set.
alter table handles add column if not exists custom_design_url text;
