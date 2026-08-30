-- Mynt migration 0002 — ownership, validation and abuse limits.
--
-- Before this migration a handle had no owner: anyone could POST a claim for
-- any handle, for free, and nobody could prove or change it afterwards. This
-- ties every claim to an authenticated user and pushes the format rules down
-- into the database so they hold even if application code is bypassed.

-- 1. Ownership -------------------------------------------------------------

alter table handles
  add column if not exists user_id uuid references auth.users (id) on delete set null;

alter table handles
  add column if not exists updated_at timestamptz not null default now();

create index if not exists handles_user_id_idx on handles (user_id);

-- 2. Format constraints (defence in depth) ---------------------------------
-- `char(3)` alone accepted "123" as letters or "abc" as digits. These checks
-- make the AAA000 shape a database-level guarantee.

alter table handles drop constraint if exists handles_letters_format;
alter table handles
  add constraint handles_letters_format check (letters ~ '^[A-Z]{3}$');

alter table handles drop constraint if exists handles_digits_format;
alter table handles
  add constraint handles_digits_format check (digits ~ '^[0-9]{3}$');

-- A claimed handle must have an owner and a claim timestamp. Rows seeded
-- before this migration are grandfathered in via `not valid`.
alter table handles drop constraint if exists handles_claimed_has_owner;
alter table handles
  add constraint handles_claimed_has_owner
  check (status <> 'claimed' or (user_id is not null and claimed_at is not null))
  not valid;

-- 3. Row Level Security ----------------------------------------------------
-- Reads stay public (profiles are meant to be shared). Owners may edit their
-- own row; creating a claim still goes through the server's service_role key
-- so that price and rate limits are enforced in one place.

drop policy if exists "owners can update their handle" on handles;
create policy "owners can update their handle"
  on handles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handles_touch_updated_at on handles;
create trigger handles_touch_updated_at
  before update on handles
  for each row execute function touch_updated_at();

-- 4. Claim rate limiting ---------------------------------------------------
-- One row per attempt, successful or not. The server counts recent rows per
-- user and per IP before allowing another claim, so a script can't sweep the
-- 17.5M-combination namespace.

create table if not exists claim_attempts (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  ip text,
  handle text,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists claim_attempts_user_idx on claim_attempts (user_id, created_at desc);
create index if not exists claim_attempts_ip_idx on claim_attempts (ip, created_at desc);

alter table claim_attempts enable row level security;
-- No policy: only the service_role key (which bypasses RLS) may read or write.
