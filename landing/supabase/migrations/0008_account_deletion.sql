-- Mynt migration 0008 — make deleting an account actually work.
--
-- Every table that references auth.users declares ON DELETE CASCADE or SET
-- NULL, but the role Supabase deletes users as, `supabase_auth_admin`, held
-- no DELETE or UPDATE privilege on any of them. The referential action then
-- fails and the API returns "Database error deleting user" — but only once
-- the user actually has rows, which is why it stayed hidden until posts and
-- follows arrived.
--
-- Two things are needed: the privileges, and somewhere for a claimed handle
-- to go when its owner disappears.

-- 1. A handle outlives its owner ------------------------------------------
-- Handles are bought. Deleting an account must not destroy a paid asset, so
-- the row stays and records that it was orphaned; support can reassign it.
-- Without this the SET NULL trips handles_claimed_has_owner and the delete
-- fails for a second, unrelated reason.

alter table handles add column if not exists owner_deleted_at timestamptz;

create or replace function mark_owner_deleted() returns trigger as $$
begin
  if new.status = 'claimed' and new.user_id is null and old.user_id is not null then
    new.owner_deleted_at := now();
  end if;
  return new;
end;
$$ language plpgsql;

-- BEFORE, so the stamp is in place by the time the check constraint runs.
drop trigger if exists handles_mark_owner_deleted on handles;
create trigger handles_mark_owner_deleted
  before update on handles
  for each row execute function mark_owner_deleted();

alter table handles drop constraint if exists handles_claimed_has_owner;
alter table handles
  add constraint handles_claimed_has_owner
  check (
    status <> 'claimed'
    or (claimed_at is not null and (user_id is not null or owner_deleted_at is not null))
  )
  not valid;

-- 2. Let the deleting role carry out the referential actions ---------------
-- Guarded so the same file runs against a plain Postgres in `npm run db:test`,
-- where the Supabase roles do not exist.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant delete on public.posts, public.follows, public.orders, public.claim_attempts
      to supabase_auth_admin;
    -- SET NULL on handles, and the counter triggers that fire alongside it.
    grant update on public.handles to supabase_auth_admin;
    grant select on public.handles to supabase_auth_admin;
  end if;
end $$;
