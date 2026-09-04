-- Flex migration 0014 — handing a handle to someone else.
--
-- Rarity is priced because a good combination should be worth more later, the
-- way a vanity plate is. That only means anything if the holder can actually
-- pass it on: a thing that cannot be handed over has no resale price, only a
-- purchase price.
--
-- A transfer is offered to an email address rather than to an account, because
-- the buyer usually does not have one yet. It waits seven days and then stops
-- being offered.

create table if not exists handle_transfers (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  from_user_id uuid not null references auth.users (id) on delete cascade,
  -- Lower-cased on write so an offer to Someone@x.com is claimable by
  -- someone@x.com, which is the same inbox.
  to_email text not null check (to_email = lower(to_email) and position('@' in to_email) > 1),
  to_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  settled_at timestamptz
);

create index if not exists handle_transfers_handle_idx
  on handle_transfers (handle, created_at desc);
create index if not exists handle_transfers_from_idx
  on handle_transfers (from_user_id, created_at desc);
create index if not exists handle_transfers_to_idx
  on handle_transfers (to_email, status);

-- One offer in flight per handle. Two live offers for the same handle is a
-- race over who accepts first, and the loser is told nothing.
create unique index if not exists handle_transfers_one_pending_idx
  on handle_transfers (handle) where status = 'pending';

alter table handle_transfers enable row level security;

-- Both sides of an offer can see it: the sender, and whoever holds the inbox
-- it was addressed to.
drop policy if exists "both sides read a transfer" on handle_transfers;
create policy "both sides read a transfer"
  on handle_transfers for select
  using (
    auth.uid() = from_user_id
    or lower(coalesce(auth.jwt() ->> 'email', '')) = to_email
  );

-- Accepting a handle is several writes that must not half-happen: the handle
-- changes owner, the profile on it is emptied, and what the previous owner
-- published under it goes with them. A function keeps them in one transaction.
--
-- What is deliberately kept: the handle's own view count, which belongs to the
-- address rather than to whoever answered at it. What is deliberately cleared:
-- posts and followers, because an audience followed a person, and inheriting
-- someone else's followers would misrepresent both of them.
create or replace function accept_handle_transfer(transfer_id uuid, new_owner uuid)
returns text as $$
declare
  t handle_transfers;
begin
  select * into t from handle_transfers
    where id = transfer_id and status = 'pending' and expires_at > now()
    for update;

  if not found then
    return null;
  end if;

  update handles set
    user_id = new_owner,
    owner_name = null,
    bio = null,
    avatar_url = null,
    links = '[]'::jsonb,
    city = null,
    contact_email = null,
    tags = '{}',
    custom_design_url = null,
    card_design = 'genesis',
    device_type = 'card',
    follower_count = 0,
    post_count = 0,
    claimed_at = now()
  where normalized = t.handle;

  delete from posts where handle = t.handle;
  delete from follows where followed_handle = t.handle;
  delete from design_requests where handle = t.handle and status = 'pending';

  update handle_transfers
    set status = 'accepted', to_user_id = new_owner, settled_at = now()
    where id = transfer_id;

  return t.handle;
end;
$$ language plpgsql security definer;

-- Only the server calls this; a signed-in user reaching it directly would be
-- accepting on behalf of an id they chose.
revoke all on function accept_handle_transfer(uuid, uuid) from public, anon, authenticated;
