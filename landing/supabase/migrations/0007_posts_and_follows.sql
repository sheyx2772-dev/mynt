-- Mynt migration 0007 — posts and following.
--
-- The part that turns a directory of business cards into something people
-- come back to. Posts belong to a handle rather than to an account, because
-- the handle is the public identity and an owner may hold several.

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  -- Kept alongside the handle so a post survives being re-read after the
  -- handle changes hands, and so authorship can be checked without a join.
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists posts_handle_idx on posts (handle, created_at desc);
create index if not exists posts_created_idx on posts (created_at desc);
create index if not exists posts_user_idx on posts (user_id, created_at desc);

alter table posts enable row level security;

-- Posts are public by design; writing goes through the server, which checks
-- that the author owns the handle.
drop policy if exists "posts are publicly readable" on posts;
create policy "posts are publicly readable" on posts for select using (true);

create table if not exists follows (
  follower_user_id uuid not null references auth.users (id) on delete cascade,
  followed_handle text not null,
  created_at timestamptz not null default now(),
  -- One follow per person per handle, enforced rather than checked in code.
  primary key (follower_user_id, followed_handle)
);

create index if not exists follows_handle_idx on follows (followed_handle);
create index if not exists follows_follower_idx on follows (follower_user_id, created_at desc);

alter table follows enable row level security;

drop policy if exists "users can read their own follows" on follows;
create policy "users can read their own follows"
  on follows for select
  using (auth.uid() = follower_user_id);

-- Denormalised for the same reason as view_count: a profile shows the number,
-- and nobody outside the follower list should be able to read the list.
alter table handles add column if not exists follower_count bigint not null default 0;
alter table handles add column if not exists post_count bigint not null default 0;

create index if not exists handles_follower_count_idx on handles (follower_count desc);

-- Counters are moved by triggers, so they cannot drift from the rows they
-- count when a follow or a post is removed by any path.
create or replace function bump_follower_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update handles set follower_count = follower_count + 1
      where normalized = new.followed_handle;
  elsif tg_op = 'DELETE' then
    update handles set follower_count = greatest(follower_count - 1, 0)
      where normalized = old.followed_handle;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists follows_bump_count on follows;
create trigger follows_bump_count
  after insert or delete on follows
  for each row execute function bump_follower_count();

create or replace function bump_post_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update handles set post_count = post_count + 1 where normalized = new.handle;
  elsif tg_op = 'DELETE' then
    update handles set post_count = greatest(post_count - 1, 0) where normalized = old.handle;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists posts_bump_count on posts;
create trigger posts_bump_count
  after insert or delete on posts
  for each row execute function bump_post_count();
