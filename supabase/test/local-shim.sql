-- Minimal stand-in for the parts of Supabase that the migrations depend on.
-- Used only by `npm run db:test`, which replays every migration against a
-- throwaway Postgres container to check the SQL before it reaches the real
-- project. Never applied to Supabase itself, which provides these already.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Supabase derives this from the request JWT. Locally it just returns
-- whatever the session sets, so RLS policies still parse and run.
create or replace function auth.uid() returns uuid as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ language sql stable;
