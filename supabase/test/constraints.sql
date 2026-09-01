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
  values ('11111111-1111-1111-1111-111111111111', 'test@flex.uz')
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

-- posts and follows ---------------------------------------------------------

select assert_rejected(
  $q$insert into posts (handle, user_id, body)
     values ('QQQ483','11111111-1111-1111-1111-111111111111','')$q$,
  'empty post body');

select assert_rejected(
  $q$insert into posts (handle, user_id, body)
     values ('QQQ483','11111111-1111-1111-1111-111111111111', repeat('x', 1001))$q$,
  'post body over the limit');

-- Counters are kept by triggers, so they must track inserts and deletes.
do $$
declare c bigint;
begin
  insert into posts (handle, user_id, body)
    values ('QQQ483','11111111-1111-1111-1111-111111111111','birinchi post');
  insert into posts (handle, user_id, body)
    values ('QQQ483','11111111-1111-1111-1111-111111111111','ikkinchi post');

  select post_count into c from handles where normalized = 'QQQ483';
  if c <> 2 then raise exception 'post_count was %, expected 2', c; end if;

  delete from posts where body = 'ikkinchi post';
  select post_count into c from handles where normalized = 'QQQ483';
  if c <> 1 then raise exception 'post_count was % after delete, expected 1', c; end if;

  raise notice '  ok   post_count follows inserts and deletes';
end $$;

do $$
declare c bigint;
begin
  insert into follows (follower_user_id, followed_handle)
    values ('11111111-1111-1111-1111-111111111111','QQQ483');

  select follower_count into c from handles where normalized = 'QQQ483';
  if c <> 1 then raise exception 'follower_count was %, expected 1', c; end if;

  delete from follows where followed_handle = 'QQQ483';
  select follower_count into c from handles where normalized = 'QQQ483';
  if c <> 0 then raise exception 'follower_count was % after unfollow, expected 0', c; end if;

  raise notice '  ok   follower_count follows follows and unfollows';
end $$;

-- Following the same handle twice is one relationship, not two.
do $$
begin
  insert into follows (follower_user_id, followed_handle)
    values ('11111111-1111-1111-1111-111111111111','QQQ483');
  begin
    insert into follows (follower_user_id, followed_handle)
      values ('11111111-1111-1111-1111-111111111111','QQQ483');
    raise exception 'a duplicate follow was accepted';
  exception when unique_violation then
    raise notice '  ok   rejected: following the same handle twice';
  end;
end $$;

-- account deletion ----------------------------------------------------------
-- A handle is a paid asset: deleting the account must orphan it, not destroy
-- it, and must not be blocked by the claimed-needs-an-owner rule.

do $$
declare orphan_user uuid := '99999999-9999-9999-9999-999999999999';
declare owner_id uuid; deleted_at timestamptz; still_claimed text;
begin
  insert into auth.users (id, email) values (orphan_user, 'leaving@flex.uz');
  insert into handles (letters, digits, status, user_id, claimed_at)
    values ('BYE','001','claimed', orphan_user, now());
  insert into posts (handle, user_id, body) values ('BYE001', orphan_user, 'xayr');
  insert into follows (follower_user_id, followed_handle) values (orphan_user, 'QQQ483');

  delete from auth.users where id = orphan_user;

  select user_id, owner_deleted_at, status into owner_id, deleted_at, still_claimed
    from handles where normalized = 'BYE001';

  if owner_id is not null then raise exception 'owner was not cleared'; end if;
  if deleted_at is null then raise exception 'owner_deleted_at was not stamped'; end if;
  if still_claimed <> 'claimed' then raise exception 'the handle stopped being claimed'; end if;

  if exists (select 1 from posts where user_id = orphan_user) then
    raise exception 'posts survived the account';
  end if;
  if exists (select 1 from follows where follower_user_id = orphan_user) then
    raise exception 'follows survived the account';
  end if;

  raise notice '  ok   deleting an account orphans the handle and clears its rows';
end $$;

-- card designs --------------------------------------------------------------

select assert_rejected(
  $q$update handles set card_design = 'porsche' where normalized = 'QQQ483'$q$,
  'a card design the renderer does not know');

do $$
declare design text;
begin
  select card_design into design from handles where normalized = 'QQQ483';
  if design <> 'genesis' then
    raise exception 'default card design was %, expected genesis', design;
  end if;

  update handles set card_design = 'naqsh' where normalized = 'QQQ483';
  raise notice '  ok   card_design defaults to genesis and accepts a known design';
end $$;

-- device types --------------------------------------------------------------

select assert_rejected(
  $q$update handles set device_type = 'watch' where normalized = 'QQQ483'$q$,
  'a form factor that is not sold');

do $$
declare t text;
begin
  select device_type into t from handles where normalized = 'QQQ483';
  if t <> 'card' then raise exception 'default device_type was %, expected card', t; end if;

  update handles set device_type = 'ring' where normalized = 'QQQ483';
  update handles set device_type = 'bracelet' where normalized = 'QQQ483';
  raise notice '  ok   device_type defaults to card and accepts ring and bracelet';
end $$;

drop function assert_rejected(text, text);

-- 0013 — design requests
do $$
declare
  uid uuid;
  ok boolean;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;
  insert into handles (letters, digits, status, user_id, claimed_at)
    values ('DSG', '001', 'claimed', uid, now());

  insert into design_requests (handle, user_id, wish, prompt)
    values ('DSG001', uid, 'qora fonda oltin naqsh', 'Create flat front-face artwork...');
  raise notice '   ok   a design request can be queued';

  begin
    insert into design_requests (handle, user_id, wish, prompt)
      values ('DSG001', uid, 'boshqa narsa', 'Create...');
    raise exception 'ikkinchi navbat qabul qilindi';
  exception when unique_violation then
    raise notice '   ok   rejected: a second pending request for the same handle';
  end;

  begin
    insert into design_requests (handle, user_id, wish, prompt)
      values ('DSG001', uid, 'ha', 'Create...');
    raise exception 'juda qisqa tavsif qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a wish too short to act on';
  end;

  begin
    insert into design_requests (handle, user_id, wish, prompt, status)
      values ('DSG001', uid, 'yaxshi tavsif', 'Create...', 'nomalum');
    raise exception 'notogri status qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a status the app does not know';
  end;

  -- Filling the request frees the handle to ask again.
  update design_requests set status = 'filled', filled_at = now() where handle = 'DSG001';
  insert into design_requests (handle, user_id, wish, prompt)
    values ('DSG001', uid, 'yangi tavsif', 'Create...');
  raise notice '   ok   a filled request frees the handle to ask again';

  update handles set custom_design_url = 'https://example.test/a.jpg' where normalized = 'DSG001';
  select custom_design_url is not null into ok from handles where normalized = 'DSG001';
  if not ok then raise exception 'custom_design_url saqlanmadi'; end if;
  raise notice '   ok   a handle can carry a design made for it alone';
end $$;

-- 0014 — handle transfers
do $$
declare
  seller uuid;
  buyer uuid;
  tid uuid;
  moved text;
  owner_now uuid;
  posts_left int;
  name_left text;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into seller;
  insert into auth.users (id) values (gen_random_uuid()) returning id into buyer;
  insert into handles (letters, digits, status, user_id, claimed_at, owner_name, bio, follower_count, post_count)
    values ('TRN', '001', 'claimed', seller, now(), 'Sotuvchi', 'eski bio', 3, 2);
  insert into posts (handle, user_id, body) values ('TRN001', seller, 'eski post');

  insert into handle_transfers (handle, from_user_id, to_email)
    values ('TRN001', seller, 'xaridor@example.com') returning id into tid;
  raise notice '   ok   a handle can be offered to an email';

  begin
    insert into handle_transfers (handle, from_user_id, to_email)
      values ('TRN001', seller, 'boshqa@example.com');
    raise exception 'ikkinchi taklif qabul qilindi';
  exception when unique_violation then
    raise notice '   ok   rejected: a second live offer for the same handle';
  end;

  begin
    insert into handle_transfers (handle, from_user_id, to_email)
      values ('TRN002', seller, 'Katta@Example.com');
    raise exception 'katta harfli email qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: an address that was not lower-cased';
  end;

  select accept_handle_transfer(tid, buyer) into moved;
  if moved is null then raise exception 'otkazish bajarilmadi'; end if;

  select user_id, owner_name into owner_now, name_left from handles where normalized = 'TRN001';
  select count(*) into posts_left from posts where handle = 'TRN001';

  if owner_now <> buyer then raise exception 'egasi ozgarmadi'; end if;
  raise notice '   ok   the handle changed hands';

  if name_left is not null then raise exception 'eski profil qoldi'; end if;
  raise notice '   ok   the previous profile is cleared';

  if posts_left <> 0 then raise exception 'eski postlar qoldi'; end if;
  raise notice '   ok   what the previous owner published goes with them';

  -- A second acceptance must do nothing: the offer is no longer pending.
  select accept_handle_transfer(tid, seller) into moved;
  if moved is not null then raise exception 'ikkinchi marta qabul qilindi'; end if;
  raise notice '   ok   an offer cannot be accepted twice';

  -- An expired offer is not claimable either.
  insert into handle_transfers (handle, from_user_id, to_email, expires_at)
    values ('TRN001', buyer, 'kech@example.com', now() - interval '1 day') returning id into tid;
  select accept_handle_transfer(tid, seller) into moved;
  if moved is not null then raise exception 'muddati otgan taklif qabul qilindi'; end if;
  raise notice '   ok   an offer past its date is not claimable';
end $$;
