-- Mynt migration 0003 — orders and payment transactions.
--
-- A handle is sold, not given away, so a claim now has two phases: the handle
-- is reserved while an order is pending, and only becomes claimed once a
-- provider confirms payment. The reservation reuses the existing unique index
-- on `normalized`, so two people cannot buy the same handle even if their
-- orders race.

-- 1. Reservations ----------------------------------------------------------

alter table handles drop constraint if exists handles_status_check;
alter table handles
  add constraint handles_status_check
  check (status in ('available', 'reserved', 'claimed'));

alter table handles
  add column if not exists reserved_until timestamptz;

-- A reservation that is never paid for must not hold the handle forever.
create index if not exists handles_reserved_until_idx
  on handles (reserved_until)
  where status = 'reserved';

-- 2. Orders ----------------------------------------------------------------

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  handle text not null,
  -- Price in so'm, recomputed server-side from the handle at order time. Kept
  -- on the order so a later change to the pricing rules cannot alter what an
  -- already-placed order is worth.
  amount bigint not null check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'failed')),
  provider text check (provider in ('click', 'payme')),
  provider_tx_id text,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on orders (user_id, created_at desc);
create index if not exists orders_handle_idx on orders (handle);
create index if not exists orders_status_idx on orders (status);

drop trigger if exists orders_touch_updated_at on orders;
create trigger orders_touch_updated_at
  before update on orders
  for each row execute function touch_updated_at();

alter table orders enable row level security;

-- Buyers may read their own orders. Writes happen server-side under the
-- service_role key, where the price is recomputed and the provider verified.
drop policy if exists "users can read their own orders" on orders;
create policy "users can read their own orders"
  on orders for select
  using (auth.uid() = user_id);

-- 3. Payme transactions ----------------------------------------------------
-- Payme identifies a transaction only by its own id after creation:
-- CheckTransaction and CancelTransaction arrive with no account data. The
-- mapping therefore has to be stored, or those methods cannot be answered.

create table if not exists payme_transactions (
  -- Payme's transaction id, not ours.
  id text primary key,
  order_id uuid not null references orders (id) on delete cascade,
  amount bigint not null,          -- tiyin, as Payme sends it
  state smallint not null default 1 check (state in (1, 2, -1, -2)),
  -- Unix milliseconds, as Payme sends and expects them back.
  create_time bigint not null,
  perform_time bigint not null default 0,
  cancel_time bigint not null default 0,
  reason smallint,
  created_at timestamptz not null default now()
);

create index if not exists payme_transactions_order_idx on payme_transactions (order_id);

-- Payme allows only one active transaction per order.
create unique index if not exists payme_transactions_active_order_idx
  on payme_transactions (order_id)
  where state in (1, 2);

alter table payme_transactions enable row level security;
-- No policy: only the service_role key may touch these rows.

-- 4. Click transactions ----------------------------------------------------
-- Click's Prepare/Complete pair is simpler — it addresses the order directly
-- by merchant_trans_id — but the ids are recorded for reconciliation.

create table if not exists click_transactions (
  id text primary key,             -- click_trans_id
  order_id uuid not null references orders (id) on delete cascade,
  amount bigint not null,          -- so'm
  prepared_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists click_transactions_order_idx on click_transactions (order_id);

alter table click_transactions enable row level security;
-- No policy: service_role only.
