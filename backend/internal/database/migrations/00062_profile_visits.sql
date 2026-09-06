-- Kim ko'rdi: the signed-in people who opened a profile.
--
-- Separate from profile_views on purpose. That table counts without keeping
-- anything that identifies a visitor, and its route says so; this one keeps
-- exactly one identity per (profile, account), because the point is the
-- name. It is written only for a reader who has an account and only when
-- that reader has not asked to be invisible — and the answer is shown only
-- to a premium owner who is not invisible themselves. The trade the network
-- people arrive from makes: you see who looked, or nobody sees you, not both.
--
-- One row per pair, moved forward on every look, rather than a row per
-- look: the owner is asking "who", not "how many times".

-- +goose Up

create table if not exists profile_visits (
  handle text not null,
  viewer_user_id uuid not null references auth.users (id) on delete cascade,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  soni integer not null default 1,
  primary key (handle, viewer_user_id)
);

create index if not exists profile_visits_recent_idx on profile_visits (handle, last_at desc);

create table if not exists viewer_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  korinmas boolean not null default false,
  updated_at timestamptz not null default now()
);

-- +goose Down

drop table if exists viewer_settings;
drop table if exists profile_visits;
