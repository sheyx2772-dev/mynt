-- Mynt migration 0005 — close the analytics functions to the public roles.
--
-- 0004 revoked execute from PUBLIC, which turned out not to be enough:
-- Supabase grants execute to the `anon` and `authenticated` roles by name, so
-- the functions stayed callable with an anon key. Row level security still
-- kept the answers empty, so nothing leaked, but an endpoint that should not
-- be reachable was reachable.
--
-- Wrapped in a role check so the same file also runs against a plain Postgres
-- in `npm run db:test`, where those Supabase roles do not exist.

do $$
declare
  fn text;
  role_name text;
begin
  foreach fn in array array[
    'handle_stats(text, integer)',
    'handle_link_stats(text, integer)'
  ] loop
    foreach role_name in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = role_name) then
        execute format('revoke all on function %s from %I', fn, role_name);
      end if;
    end loop;
  end loop;
end $$;
