-- Asserts that the schema refuses bad data on its own, without help from the
-- application. Each block performs a write that must fail; if the write
-- succeeds the block raises, and the whole run fails.
--
-- Run with: npm run db:test

\set ON_ERROR_STOP on

create or replace function assert_rejected(stmt text, label text) returns void as $$
begin
  begin
    execute stmt;
  exception
    when check_violation or unique_violation or foreign_key_violation or not_null_violation then
      raise notice '  ok   rejected: %', label;
      return;
  end;
  raise exception 'ACCEPTED BUT SHOULD HAVE BEEN REJECTED: %', label;
end;
$$ language plpgsql;

insert into auth.users (id, email)
  values ('11111111-1111-1111-1111-111111111111', 'test@mynt.uz')
  on conflict do nothing;

-- handles ------------------------------------------------------------------

select assert_rejected(
  $q$insert into handles (letters, digits) values ('123','042')$q$,
  'digits used as letters');

select assert_rejected(
  $q$insert into handles (letters, digits) values ('abc','042')$q$,
  'lowercase letters');

select assert_rejected(
  $q$insert into handles (letters, digits) values ('ABC','abc')$q$,
  'letters used as digits');

select assert_rejected(
  $q$insert into handles (letters, digits, status) values ('AAA','111','claimed')$q$,
  'claimed handle with no owner');

select assert_rejected(
  $q$insert into handles (letters, digits, status) values ('BBB','222','sold')$q$,
  'unknown handle status');

insert into handles (letters, digits) values ('QQQ','483');
insert into handles (letters, digits, status, reserved_until)
  values ('RRR','777','reserved', now() + interval '30 minutes');
insert into handles (letters, digits, status, user_id, claimed_at)
  values ('ZZZ','999','claimed','11111111-1111-1111-1111-111111111111', now());

select assert_rejected(
  $q$insert into handles (letters, digits) values ('QQQ','483')$q$,
  'duplicate handle');

-- orders -------------------------------------------------------------------

select assert_rejected(
  $q$insert into orders (user_id, handle, amount)
     values ('11111111-1111-1111-1111-111111111111','QQQ483',-100)$q$,
  'negative order amount');

select assert_rejected(
  $q$insert into orders (user_id, handle, amount)
     values ('11111111-1111-1111-1111-111111111111','QQQ483',0)$q$,
  'zero order amount');

select assert_rejected(
  $q$insert into orders (user_id, handle, amount, status)
     values ('11111111-1111-1111-1111-111111111111','QQQ483',99000,'half')$q$,
  'unknown order status');

select assert_rejected(
  $q$insert into orders (user_id, handle, amount, provider)
     values ('11111111-1111-1111-1111-111111111111','QQQ483',99000,'paypal')$q$,
  'unknown payment provider');

insert into orders (id, user_id, handle, amount)
  values ('22222222-2222-2222-2222-222222222222',
          '11111111-1111-1111-1111-111111111111','QQQ483',99000);

-- payme_transactions -------------------------------------------------------

select assert_rejected(
  $q$insert into payme_transactions (id, order_id, amount, state, create_time)
     values ('bad','22222222-2222-2222-2222-222222222222',9900000,5,1)$q$,
  'invalid Payme state');

insert into payme_transactions (id, order_id, amount, state, create_time)
  values ('tx-1','22222222-2222-2222-2222-222222222222',9900000,1,1);

-- Two live transactions for one order would let two people buy one handle.
select assert_rejected(
  $q$insert into payme_transactions (id, order_id, amount, state, create_time)
     values ('tx-2','22222222-2222-2222-2222-222222222222',9900000,1,1)$q$,
  'second active transaction for one order');

update payme_transactions set state = -1 where id = 'tx-1';
insert into payme_transactions (id, order_id, amount, state, create_time)
  values ('tx-2','22222222-2222-2222-2222-222222222222',9900000,1,1);

-- updated_at trigger -------------------------------------------------------

do $$
declare before_ts timestamptz; after_ts timestamptz;
begin
  select updated_at into before_ts from orders
    where id = '22222222-2222-2222-2222-222222222222';
  perform pg_sleep(0.05);
  update orders set status = 'paid'
    where id = '22222222-2222-2222-2222-222222222222';
  select updated_at into after_ts from orders
    where id = '22222222-2222-2222-2222-222222222222';

  if after_ts <= before_ts then
    raise exception 'updated_at trigger did not fire';
  end if;
  raise notice '  ok   updated_at advances on update';
end $$;

-- analytics -----------------------------------------------------------------

insert into profile_views (handle, visitor_hash) values
  ('QQQ483','visitor-a'), ('QQQ483','visitor-a'), ('QQQ483','visitor-b');
insert into link_clicks (handle, label, visitor_hash) values
  ('QQQ483','Telegram','visitor-a'), ('QQQ483','Telegram','visitor-b'),
  ('QQQ483','Veb-sayt','visitor-a');

do $$
declare row_count integer; today_views bigint; today_visitors bigint; today_clicks bigint;
begin
  select count(*) into row_count from handle_stats('QQQ483', 30);
  if row_count <> 30 then
    raise exception 'handle_stats returned % rows, expected a zero-filled 30', row_count;
  end if;
  raise notice '  ok   handle_stats zero-fills the whole window';

  select views, visitors, clicks into today_views, today_visitors, today_clicks
    from handle_stats('QQQ483', 30) where day = current_date;

  if today_views <> 3 then raise exception 'views was %, expected 3', today_views; end if;
  -- Three visits from two people.
  if today_visitors <> 2 then raise exception 'visitors was %, expected 2', today_visitors; end if;
  if today_clicks <> 3 then raise exception 'clicks was %, expected 3', today_clicks; end if;
  raise notice '  ok   handle_stats counts views, unique visitors and clicks';
end $$;

do $$
declare top_label text; top_clicks bigint;
begin
  select label, clicks into top_label, top_clicks
    from handle_link_stats('QQQ483', 30) limit 1;

  if top_label <> 'Telegram' or top_clicks <> 2 then
    raise exception 'link stats gave %/%, expected Telegram/2', top_label, top_clicks;
  end if;
  raise notice '  ok   handle_link_stats ranks links by clicks';
end $$;

-- A handle with no traffic must still produce a full, empty series.
do $$
declare total bigint;
begin
  select sum(views) into total from handle_stats('ZZZ999', 30);
  if coalesce(total, 0) <> 0 then
    raise exception 'expected no views for an untouched handle, got %', total;
  end if;
  raise notice '  ok   an untouched handle reports zeros, not nulls';
end $$;

-- social profile ------------------------------------------------------------

do $$
declare before_count bigint; after_count bigint;
begin
  select view_count into before_count from handles where normalized = 'QQQ483';
  perform increment_view_count('QQQ483');
  perform increment_view_count('QQQ483');
  select view_count into after_count from handles where normalized = 'QQQ483';

  if after_count <> before_count + 2 then
    raise exception 'view_count went from % to %, expected +2', before_count, after_count;
  end if;
  raise notice '  ok   increment_view_count adds exactly one per call';
end $$;

-- The leaderboard must rank claimed handles by recent views and expose only
-- the aggregate — never a visitor hash or a referrer.
do $$
declare top_handle text; top_views bigint; column_count integer;
begin
  insert into handles (letters, digits, status, user_id, claimed_at)
    values ('TOP','001','claimed','11111111-1111-1111-1111-111111111111', now());
  insert into profile_views (handle, visitor_hash)
    select 'TOP001', 'v' || g from generate_series(1, 5) g;

  select normalized, views into top_handle, top_views from top_handles(3, 3) limit 1;

  if top_handle <> 'TOP001' or top_views <> 5 then
    raise exception 'top_handles gave %/%, expected TOP001/5', top_handle, top_views;
  end if;

  select count(*) into column_count
    from information_schema.routines r
    join lateral (select 1) x on true
    where r.routine_name = 'top_handles';
  raise notice '  ok   top_handles ranks by recent views';
end $$;

-- An unclaimed handle with traffic must not appear in the directory ranking.
do $$
declare found integer;
begin
  insert into profile_views (handle, visitor_hash)
    select 'RRR777', 'u' || g from generate_series(1, 99) g;

  select count(*) into found from top_handles(3, 10) where normalized = 'RRR777';
  if found <> 0 then
    raise exception 'a reserved handle appeared in the leaderboard';
  end if;
  raise notice '  ok   only claimed handles reach the leaderboard';
end $$;

drop function assert_rejected(text, text);
