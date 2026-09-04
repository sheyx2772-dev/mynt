-- Flex migration 0027 — invoices, because a company does not pay by card.
--
-- The personal subscription goes through Click and Payme and settles itself. A
-- firm cannot use either: its money leaves a bank account against a document
-- its accountant files, and nobody in a finance department is putting twenty
-- seats on a personal card. So a team pays the way every other supplier here is
-- paid — an invoice, a transfer, and the plan switched on when the money lands.
--
-- Which means the buyer's own requisites have to be stored: an invoice missing
-- the buyer's INN is one the bank sends back.

alter table teams add column if not exists legal_name text
  check (legal_name is null or char_length(legal_name) <= 200);
alter table teams add column if not exists inn text
  check (inn is null or inn ~ '^[0-9]{9}$');
alter table teams add column if not exists address text
  check (address is null or char_length(address) <= 300);
alter table teams add column if not exists bank_name text
  check (bank_name is null or char_length(bank_name) <= 200);
alter table teams add column if not exists bank_account text
  check (bank_account is null or bank_account ~ '^[0-9]{20}$');
alter table teams add column if not exists bank_mfo text
  check (bank_mfo is null or bank_mfo ~ '^[0-9]{5}$');
alter table teams add column if not exists director text
  check (director is null or char_length(director) <= 120);

create table if not exists team_invoices (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  -- Human-facing, sequential, and what the accountant refers to on the phone.
  number bigserial not null unique,
  seats integer not null check (seats > 0),
  months integer not null check (months in (1, 3, 6, 12)),
  -- Copied at issue, not read from the price list later: an invoice is a
  -- document, and what it says has to stay what it said.
  seat_monthly bigint not null check (seat_monthly > 0),
  -- Whether VAT was charged, as a number rather than an assumption. Zero means
  -- the invoice says so; it does not mean nobody thought about it.
  vat_percent numeric(5, 2) not null default 0 check (vat_percent between 0 and 100),
  total bigint not null check (total > 0),
  status text not null default 'issued'
    check (status in ('issued', 'paid', 'cancelled')),
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  note text check (note is null or char_length(note) <= 300)
);

create index if not exists team_invoices_team_idx on team_invoices (team_id, issued_at desc);

alter table team_invoices enable row level security;
-- Administrative, like the roster: read through the service role, where the
-- caller's membership is checked.
revoke all on team_invoices from anon, authenticated;

-- Settling an invoice, as one statement: marking it paid and extending the
-- company are the same event, and an invoice marked paid against a company that
-- was never extended is the worst of the three possible states.
--
-- Conditional on `issued`, so paying twice extends once.
create or replace function settle_team_invoice(invoice_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_invoice team_invoices%rowtype;
begin
  update team_invoices
  set status = 'paid', paid_at = now()
  where id = invoice_id and status = 'issued'
  returning * into paid_invoice;

  if paid_invoice.id is null then
    return false;
  end if;

  update teams
  set seats = greatest(seats, paid_invoice.seats),
      plan_expires_at = greatest(coalesce(plan_expires_at, now()), now())
        + (paid_invoice.months || ' months')::interval,
      updated_at = now()
  where id = paid_invoice.team_id;

  return true;
end;
$$;

revoke execute on function settle_team_invoice(uuid) from public;
revoke execute on function settle_team_invoice(uuid) from anon;
revoke execute on function settle_team_invoice(uuid) from authenticated;
