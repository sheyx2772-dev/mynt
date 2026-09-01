-- Minimal stand-in for the parts of Supabase that the migrations depend on.
-- Used only by `npm run db:test`, which replays every migration against a
-- throwaway Postgres container to check the SQL before it reaches the real
-- project. Never applied to Supabase itself, which provides these already.

-- Supabase ships these roles; migrations grant to them by name. Creating them
-- here keeps the test database close enough that a grant does not have to be
-- wrapped in an existence check just to survive the local run.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

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

-- Same idea for the whole claim set: a policy that reads the signed-in address
-- has to parse and run here, even though nothing sets a JWT in the test run.
create or replace function auth.jwt() returns jsonb as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$ language sql stable;
