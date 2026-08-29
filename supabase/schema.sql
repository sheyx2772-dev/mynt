-- Mynt: handles table
-- Run this once in the Supabase SQL editor for your project.

create table if not exists handles (
  id uuid primary key default gen_random_uuid(),
  letters char(3) not null,
  digits char(3) not null,
  normalized text generated always as (upper(letters) || digits) stored unique,
  status text not null default 'available' check (status in ('available', 'claimed')),
  owner_name text,
  bio text,
  links jsonb not null default '[]',
  price_paid bigint,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index if not exists handles_normalized_idx on handles (normalized);

alter table handles enable row level security;

-- Anyone can read handle/profile data (public profile pages).
create policy "handles are publicly readable"
  on handles for select
  using (true);

-- Writes go through server-side code using the service role key only —
-- no insert/update/delete policy is defined for the anon/public role.
