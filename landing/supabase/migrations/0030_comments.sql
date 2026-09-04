-- Flex migration 0030 — comments on a profile.
--
-- The competitor has these and is a social network. This is a visiting card,
-- and the difference matters: a public comment on a lawyer's card is a review
-- they never asked for, left by somebody who may be a competitor, sitting under
-- their name permanently.
--
-- So the owner is in control of it. Comments are off until they turn them on,
-- and they can remove any of them. That is not a compromise on the feature —
-- it is the only version of it a professional would switch on at all, and a
-- feature nobody enables is worth nothing.

alter table handles add column if not exists comments_open boolean not null default false;

create table if not exists profile_comments (
  id bigserial primary key,
  handle_id uuid not null references handles (id) on delete cascade,
  -- Who wrote it. Signed in, always: an anonymous comment under somebody's
  -- professional name is the version of this that gets abused.
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  -- One per person per profile. A comment thread on a business card is not a
  -- conversation, and letting one account post ten is how it becomes one.
  unique (handle_id, author_id)
);

create index if not exists profile_comments_handle_idx
  on profile_comments (handle_id, created_at desc);

alter table profile_comments enable row level security;

-- Anyone may read them: they appear on a page anyone can open.
drop policy if exists profile_comments_public_read on profile_comments;
create policy profile_comments_public_read on profile_comments for select using (true);

-- Writing goes through the server, where the profile is checked for being open
-- to comments at all and the rate limit is applied.
revoke insert, update on profile_comments from anon, authenticated;

-- Both sides may delete: the author because they wrote it, the owner because it
-- is their card.
drop policy if exists profile_comments_delete on profile_comments;
create policy profile_comments_delete on profile_comments
  for delete using (
    author_id = auth.uid()
    or exists (
      select 1 from handles h
      where h.id = profile_comments.handle_id and h.user_id = auth.uid()
    )
  );
