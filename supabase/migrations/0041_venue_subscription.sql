-- Flex migration 0041 — the venue product starts costing money.
--
-- Everything a cafe uses has worked for free since it was built: the menu, the
-- printed tags, the calls from the table, the phone on the counter, the report.
-- The business page has been quoting 149,000 and 299,000 a month the whole
-- time, and nothing in the database knew what a month was.
--
-- One column decides it. `plan_expires_at` is when this venue stops being paid
-- for, and a new venue is given thirty days of it — a trial and a subscription
-- are the same fact seen twice, so there is no second flag to keep in step.
--
-- What expiry does is the important half, and it is deliberately narrow:
--
--   * The guest page keeps working. A sticker on a table cannot die because an
--     invoice is late; the venue would be embarrassed in front of its own
--     customers by our billing, which is not a thing we get to do to them.
--   * The call button goes away, because a request nobody is allowed to read is
--     worse than no button at all.
--   * The report locks.
--
-- The menu stays editable throughout, so a venue that lapses over a holiday
-- comes back to a correct menu rather than a stale one.

alter table venues
  add column if not exists plan_expires_at timestamptz not null default now() + interval '30 days';

comment on column venues.plan_expires_at is
  'When this venue stops being paid for. Thirty days from creation is the trial.';

-- One series for every invoice this company issues.
--
-- team_invoices numbered itself from its own bigserial, and a second serial
-- here would mean two different documents both called number 1 — which is a
-- conversation with an accountant nobody wants to have. Both tables draw from
-- this from now on; the numbers already issued keep theirs.
do $$
declare
  next_no bigint;
begin
  if to_regclass('public.flex_invoice_no') is null then
    select coalesce(max(number), 0) + 1 into next_no from team_invoices;
    execute format('create sequence flex_invoice_no start with %s', greatest(next_no, 1));
  end if;
end $$;

alter table team_invoices alter column number set default nextval('flex_invoice_no');

create table if not exists venue_invoices (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,

  number bigint not null unique default nextval('flex_invoice_no'),

  -- How big the venue was when the invoice was written. The band follows the
  -- point count, and a venue that adds ten tables next month should not change
  -- what last month's document says.
  points integer not null check (points > 0),
  months integer not null check (months in (1, 3, 6, 12)),

  -- Copied at issue, not read from the price list later: an invoice is a
  -- document, and what it says has to stay what it said.
  monthly bigint not null check (monthly > 0),

  vat_percent numeric(5, 2) not null default 0 check (vat_percent between 0 and 100),
  total bigint not null check (total > 0),

  status text not null default 'issued'
    check (status in ('issued', 'paid', 'cancelled')),
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  note text check (note is null or char_length(note) <= 300)
);

create index if not exists venue_invoices_venue_idx
  on venue_invoices (venue_id, issued_at desc);

alter table venue_invoices enable row level security;
-- Administrative: read through the service role, where the caller's ownership
-- of the venue is checked.
revoke all on venue_invoices from anon, authenticated;

-- Settling, as one statement: marking the invoice paid and extending the venue
-- are the same event, and an invoice marked paid against a venue that was never
-- extended is the worst of the three possible states.
--
-- Conditional on `issued`, so paying twice extends once. Extended from whichever
-- is later — the current expiry or now — so paying early adds to the end of the
-- term rather than throwing away the days already bought, and paying two months
-- late does not backdate the venue into an expiry it already served.
create or replace function settle_venue_invoice(invoice_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_invoice venue_invoices%rowtype;
begin
  update venue_invoices
  set status = 'paid', paid_at = now()
  where id = invoice_id and status = 'issued'
  returning * into paid_invoice;

  if paid_invoice.id is null then
    return false;
  end if;

  update venues
  set plan_expires_at = greatest(plan_expires_at, now())
        + (paid_invoice.months || ' months')::interval,
      updated_at = now()
  where id = paid_invoice.venue_id;

  return true;
end;
$$;

revoke execute on function settle_venue_invoice(uuid) from public;
revoke execute on function settle_venue_invoice(uuid) from anon;
revoke execute on function settle_venue_invoice(uuid) from authenticated;
