-- Flex migration 0024 — companies.
--
-- The decisions here were taken from how the market already works, because
-- these are questions every one of these products has had to answer:
--
-- Who pays. The company, on one account, by the seat. Splitting it per employee
-- would mean twenty separate Payme charges a month, which is worse here than
-- anywhere: it is the finance department's problem, not twenty people's.
--
-- What happens when somebody leaves. The handle stays with the company. A firm
-- buys MCL001..MCL020 as a block, and the block is the point; a number that
-- walks out of the door with a leaver breaks the set and cannot be re-issued
-- with the printed card. Blinq deactivates the leaver's card automatically and
-- makes the seat reusable, and that is the same answer. What leaves with the
-- person is their own data, which is wiped rather than inherited by whoever
-- gets the number next.
--
-- This has to be said plainly where a company buys, and to the employee
-- carrying the card: a number that is not yours should never be a surprise.

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  -- Seats are bought, not people. A leaver frees one rather than burning it.
  seats integer not null default 5 check (seats between 1 and 500),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teams_owner_idx on teams (owner_user_id);

-- Who may administer the company. The owner is a member by construction; extra
-- admins exist because the person who pays is rarely the person who runs it.
create table if not exists team_members (
  team_id uuid not null references teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- A handle belonging to a company rather than to the person holding it.
-- Nullable: every handle sold so far is personal and stays that way.
alter table handles add column if not exists team_id uuid references teams (id) on delete set null;
create index if not exists handles_team_idx on handles (team_id);

alter table teams enable row level security;
alter table team_members enable row level security;

-- A member reads their own company. Writes go through the service role, where
-- the seat count and the billing are checked.
drop policy if exists teams_member_reads on teams;
create policy teams_member_reads on teams
  for select using (
    owner_user_id = auth.uid()
    or exists (select 1 from team_members m where m.team_id = teams.id and m.user_id = auth.uid())
  );

drop policy if exists team_members_self_reads on team_members;
create policy team_members_self_reads on team_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from teams t where t.id = team_members.team_id and t.owner_user_id = auth.uid())
  );

-- Offboarding, as one statement so a half-finished wipe cannot exist.
--
-- The handle stays with the company and returns to its pool. Everything the
-- leaver put on it goes: their name, their face, their number, their links,
-- their services. The counters go too — follower and view counts belong to the
-- person who earned them, and inheriting them would misrepresent whoever holds
-- the number next.
create or replace function release_team_handle(target_handle text, acting_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  released boolean;
begin
  update handles h
  set user_id = null,
      owner_name = null,
      bio = null,
      avatar_url = null,
      banner_url = null,
      links = '[]'::jsonb,
      services = '[]'::jsonb,
      phone = null,
      contact_email = null,
      position = null,
      company = null,
      city = null,
      tags = '{}',
      last_seen_at = null,
      view_count = 0,
      follower_count = 0,
      -- Still the company's, still claimed, just nobody's desk.
      status = 'claimed'
  from teams t
  where h.normalized = target_handle
    and h.team_id = t.id
    and (
      t.owner_user_id = acting_user
      or exists (select 1 from team_members m where m.team_id = t.id and m.user_id = acting_user)
    )
  returning true into released;

  return coalesce(released, false);
end;
$$;

revoke execute on function release_team_handle(text, uuid) from public;
revoke execute on function release_team_handle(text, uuid) from anon;
revoke execute on function release_team_handle(text, uuid) from authenticated;

-- A company handle with nobody holding it is a valid state — it is a number
-- sitting in the firm's pool between one employee and the next. Without this
-- the release above trips handles_claimed_has_owner.
alter table handles drop constraint if exists handles_claimed_has_owner;
alter table handles
  add constraint handles_claimed_has_owner
  check (
    status <> 'claimed'
    or (
      claimed_at is not null
      and (user_id is not null or owner_deleted_at is not null or team_id is not null)
    )
  )
  not valid;

-- And it must not be stamped as an orphan. `owner_deleted_at` means the account
-- that held it was deleted, which support reads as "reassign this on request";
-- an employee leaving a company is neither of those things, and marking it so
-- would put a lie in the record.
create or replace function mark_owner_deleted() returns trigger as $$
begin
  if new.status = 'claimed'
     and new.user_id is null
     and old.user_id is not null
     and new.team_id is null then
    new.owner_deleted_at := now();
  end if;
  return new;
end;
$$ language plpgsql;
