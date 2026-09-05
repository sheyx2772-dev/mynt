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

-- Supabase's own table has a unique index on the address; without it here, a
-- test that signs the same person in twice creates two accounts and passes
-- against a shape production does not have.
-- Only the columns something here actually reads. Supabase's own table has
-- forty; adding all of them would be pretending this is that table rather than
-- a stand-in for it. But a column that is read has to be here, or a query that
-- works in production fails locally for a reason that looks like a bug in the
-- query — which is how `created_at` came to be added.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

-- For a database created before that column existed.
alter table auth.users add column if not exists created_at timestamptz not null default now();

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

-- Supabase hands the API roles full table access and relies on row level
-- security to narrow it: `grant all on all tables in schema public to anon,
-- authenticated, service_role`, plus a default privilege so every table made
-- later starts the same way.
--
-- Without that here, a migration that takes a privilege back is untestable —
-- it revokes something the local roles never held, and a test asserting the
-- write is refused would pass against a database that had simply never granted
-- it. Starting from Supabase's position is what makes those revokes mean
-- something locally.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
