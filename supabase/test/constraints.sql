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

-- 0015 — plans
do $$
declare
  uid uuid;
  p text;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;
  insert into handles (letters, digits, status, user_id, claimed_at)
    values ('PLN', '001', 'claimed', uid, now());

  select plan into p from handles where normalized = 'PLN001';
  if p <> 'free' then raise exception 'sukut boyicha free emas'; end if;
  raise notice '   ok   a handle starts on the free plan';

  update handles set plan = 'premium', plan_expires_at = now() + interval '30 days'
    where normalized = 'PLN001';
  raise notice '   ok   a handle can be moved to premium';

  begin
    update handles set plan = 'gold' where normalized = 'PLN001';
    raise exception 'nomalum tarif qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a plan the app does not sell';
  end;
end $$;

-- 0016 — team requests
do $$
begin
  insert into team_requests (company, contact_name, phone, team_size)
    values ('Test MCHJ', 'Javohir', '+998901234567', 20);
  raise notice '   ok   a company can ask for a team order';

  begin
    insert into team_requests (company, contact_name, phone, team_size)
      values ('X', 'Javohir', '+998901234567', 20);
    raise exception 'juda qisqa nom qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a company name too short to call back';
  end;

  begin
    insert into team_requests (company, contact_name, phone, team_size)
      values ('Test MCHJ', 'Javohir', '123', 20);
    raise exception 'juda qisqa telefon qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a phone number that cannot be dialled';
  end;

  begin
    insert into team_requests (company, contact_name, phone, team_size)
      values ('Test MCHJ', 'Javohir', '+998901234567', 0);
    raise exception 'nol xodim qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a team of nobody';
  end;
end $$;

-- 0017 — gifted handles
do $$
declare
  uid uuid;
  paid numeric;
  reason text;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;
  insert into handles (letters, digits, status, user_id, claimed_at, gift_reason)
    values ('GFT', '001', 'claimed', uid, now(), 'sartarosh, Chilonzor');

  select price_paid, gift_reason into paid, reason from handles where normalized = 'GFT001';
  if paid is not null then raise exception 'sovga narx bilan yozildi'; end if;
  if reason is null then raise exception 'sabab saqlanmadi'; end if;
  raise notice '   ok   a gifted handle carries a reason and no price';

  begin
    update handles set gift_reason = 'ha' where normalized = 'GFT001';
    raise exception 'juda qisqa sabab qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a reason too short to mean anything';
  end;
end $$;

-- 0019 — contact fields
do $$
declare
  uid uuid;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;
  insert into handles (letters, digits, status, user_id, claimed_at, phone, position, company)
    values ('CNT', '001', 'claimed', uid, now(), '+998 90 123 45 67', 'Direktor', 'MC LEGAL');
  raise notice '   ok   a profile can carry a phone, a position and a company';

  begin
    update handles set phone = 'aloqa uchun qongiroq qiling' where normalized = 'CNT001';
    raise exception 'harfli telefon qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a phone number that is not a number';
  end;

  begin
    update handles set position = repeat('x', 81) where normalized = 'CNT001';
    raise exception 'juda uzun lavozim qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a position too long to sit under a name';
  end;
end $$;

-- 0020 — services
do $$
declare
  uid uuid;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;
  insert into handles (letters, digits, status, user_id, claimed_at, services)
    values ('SRV', '001', 'claimed', uid, now(),
      '[{"name":"Shartnoma tuzish","price":"500 000 so''m"},{"name":"Konsultatsiya","price":"kelishilgan holda"}]'::jsonb);
  raise notice '   ok   a profile can list what it sells and what it costs';

  begin
    update handles set services = '[{"price":"100 000"}]'::jsonb where normalized = 'SRV001';
    raise exception 'nomsiz xizmat qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a price with nothing priced';
  end;

  begin
    update handles set services = '"xizmatlar"'::jsonb where normalized = 'SRV001';
    raise exception 'massiv bo''lmagan qiymat qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: services that are not a list';
  end;

  begin
    update handles
      set services = (select jsonb_agg(jsonb_build_object('name', 'x' || i)) from generate_series(1, 9) i)
      where normalized = 'SRV001';
    raise exception 'to''qqizta xizmat qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: more services than a card can carry';
  end;
end $$;

-- 0021 — leads
do $$
declare
  uid uuid;
  hid uuid;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;
  insert into handles (letters, digits, status, user_id, claimed_at)
    values ('LED', '001', 'claimed', uid, now()) returning id into hid;

  insert into leads (handle_id, name, phone, company, source)
    values (hid, 'Javohir Abrorov', '+998 90 123 45 67', 'MC LEGAL', 'nfc');
  raise notice '   ok   a visitor can send their contact back to a profile';

  begin
    insert into leads (handle_id, name) values (hid, 'Nomsiz odam');
    raise exception 'aloqasiz lead qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a lead with no way to answer it';
  end;

  begin
    insert into leads (handle_id, name, phone) values (hid, 'X', 'qongiroq qiling');
    raise exception 'harfli telefon qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a lead phone that is not a number';
  end;

  begin
    insert into leads (handle_id, name, email, source)
      values (hid, 'X', 'a@b.uz', 'boshqa');
    raise exception 'notanish manba qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a source outside nfc/qr/share';
  end;

  -- Deleting the handle takes its leads with it.
  delete from handles where id = hid;
  if exists (select 1 from leads where handle_id = hid) then
    raise exception 'handle o''chirilgach leadlar qoldi';
  end if;
  raise notice '   ok   leads go with the handle they were sent to';
end $$;

-- 0022 — banner
do $$
declare
  uid uuid;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;
  insert into handles (letters, digits, status, user_id, claimed_at, banner_url)
    values ('BNR', '001', 'claimed', uid, now(), 'https://cdn.flex.com.uz/banners/BNR001.jpg');
  raise notice '   ok   a profile can carry its own cover';

  begin
    update handles set banner_url = 'javascript:alert(1)' where normalized = 'BNR001';
    raise exception 'https bo''lmagan banner qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a cover that is not an https address';
  end;
end $$;

-- 0023 — subscription orders
do $$
declare
  uid uuid;
  expiry timestamptz;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;
  insert into handles (letters, digits, status, user_id, claimed_at)
    values ('SUB', '001', 'claimed', uid, now());

  insert into orders (user_id, handle, amount, kind, months)
    values (uid, 'SUB001', 490000, 'subscription', 12);
  raise notice '   ok   an order can be for a subscription';

  begin
    insert into orders (user_id, handle, amount, kind, months)
      values (uid, 'SUB001', 49000, 'subscription', 7);
    raise exception 'sotilmaydigan muddat qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a period that is not sold';
  end;

  begin
    insert into orders (user_id, handle, amount, kind, months)
      values (uid, 'SUB001', 100000, 'handle', 1);
    raise exception 'handle buyurtmasiga muddat qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: months on an order that buys a handle';
  end;

  perform extend_premium('SUB001', 1);
  select plan_expires_at into expiry from handles where normalized = 'SUB001';
  if expiry < now() + interval '27 days' then
    raise exception 'obuna uzaytirilmadi';
  end if;
  raise notice '   ok   a payment extends the plan by its months';

  -- Renewing early adds to what is left rather than replacing it.
  perform extend_premium('SUB001', 1);
  select plan_expires_at into expiry from handles where normalized = 'SUB001';
  if expiry < now() + interval '57 days' then
    raise exception 'erta uzaytirish qoldiq muddatni yedi';
  end if;
  raise notice '   ok   renewing early adds to the time still left';

  -- A refund runs the same function backwards.
  perform extend_premium('SUB001', -2);
  select plan_expires_at into expiry from handles where normalized = 'SUB001';
  if expiry > now() + interval '1 day' then
    raise exception 'qaytarilgan to''lov muddatni qisqartirmadi';
  end if;
  raise notice '   ok   a refund takes the months back off';
end $$;

-- 0024 — teams
do $$
declare
  boss uuid;
  worker uuid;
  outsider uuid;
  team uuid;
  released boolean;
  row_after handles%rowtype;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into boss;
  insert into auth.users (id) values (gen_random_uuid()) returning id into worker;
  insert into auth.users (id) values (gen_random_uuid()) returning id into outsider;

  insert into teams (name, owner_user_id, seats) values ('MC LEGAL', boss, 20)
    returning id into team;
  raise notice '   ok   a company can be created with its seats';

  begin
    insert into teams (name, owner_user_id, seats) values ('X', boss, 0);
    raise exception 'nol o''rin qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a company with no seats';
  end;

  insert into handles (letters, digits, status, user_id, claimed_at, team_id,
                       owner_name, bio, phone, view_count, follower_count)
    values ('MCL', '001', 'claimed', worker, now(), team,
            'Xodim Xodimov', 'Yurist', '+998 90 000 00 00', 120, 7);

  -- Somebody with no part in the company cannot empty its desk.
  released := release_team_handle('MCL001', outsider);
  if released then
    raise exception 'begona odam raqamni bo''shatdi';
  end if;
  raise notice '   ok   rejected: an outsider releasing a company handle';

  released := release_team_handle('MCL001', boss);
  if not released then
    raise exception 'egasi raqamni bo''shata olmadi';
  end if;

  select * into row_after from handles where normalized = 'MCL001';
  if row_after.user_id is not null
     or row_after.owner_name is not null
     or row_after.phone is not null
     or row_after.view_count <> 0
     or row_after.follower_count <> 0 then
    raise exception 'xodim ma''lumoti tozalanmadi';
  end if;
  raise notice '   ok   a leaver takes their data with them, not the number';

  if row_after.team_id is null or row_after.status <> 'claimed' then
    raise exception 'raqam firmadan chiqib ketdi';
  end if;
  raise notice '   ok   the handle stays with the company, still claimed';

  -- And it must not be recorded as an abandoned account.
  if row_after.owner_deleted_at is not null then
    raise exception 'ketgan xodim hisob o''chirilgandek belgilandi';
  end if;
  raise notice '   ok   a leaver is not recorded as a deleted account';
end $$;

-- 0025 — team branding
do $$
declare
  boss uuid;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into boss;
  insert into teams (name, owner_user_id, seats, logo_url, website, city)
    values ('MC LEGAL BRAND', boss, 5,
            'https://cdn.flex.com.uz/logos/mc.png', 'https://mc-legal.uz', 'Toshkent');
  raise notice '   ok   a company can carry its logo, site and city';

  begin
    update teams set website = 'javascript:alert(1)' where name = 'MC LEGAL BRAND';
    raise exception 'https bo''lmagan sayt qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a company site that is not an https address';
  end;
end $$;

-- 0027 — invoices
do $$
declare
  boss uuid;
  team uuid;
  inv uuid;
  settled boolean;
  after_row teams%rowtype;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into boss;
  insert into teams (name, owner_user_id, seats, inn, bank_account, bank_mfo)
    values ('INV TEST', boss, 5, '312559000', '20212000507346035001', '00423')
    returning id into team;
  raise notice '   ok   a company can carry the requisites an invoice needs';

  begin
    update teams set inn = '12345' where id = team;
    raise exception 'noto''g''ri INN qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: an INN that is not nine digits';
  end;

  insert into team_invoices (team_id, seats, months, seat_monthly, total)
    values (team, 20, 12, 29000, 20 * 12 * 29000)
    returning id into inv;

  begin
    insert into team_invoices (team_id, seats, months, seat_monthly, total)
      values (team, 20, 5, 29000, 100);
    raise exception 'sotilmaydigan muddat qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: an invoice period that is not sold';
  end;

  settled := settle_team_invoice(inv);
  if not settled then
    raise exception 'hisob-faktura yopilmadi';
  end if;

  select * into after_row from teams where id = team;
  if after_row.seats <> 20 then
    raise exception 'o''rinlar soni yangilanmadi';
  end if;
  if after_row.plan_expires_at < now() + interval '300 days' then
    raise exception 'firma obunasi uzaytirilmadi';
  end if;
  raise notice '   ok   paying an invoice raises the seats and extends the plan';

  -- The provider, or a person, may do this twice.
  settled := settle_team_invoice(inv);
  if settled then
    raise exception 'bir hisob-faktura ikki marta yopildi';
  end if;
  select * into after_row from teams where id = team;
  if after_row.plan_expires_at > now() + interval '400 days' then
    raise exception 'ikkinchi to''lov muddatni yana uzaytirdi';
  end if;
  raise notice '   ok   settling the same invoice twice extends it once';

  -- Seats never fall on renewal: a company that shrank its order keeps the
  -- staff it already provisioned until somebody decides otherwise.
  insert into team_invoices (team_id, seats, months, seat_monthly, total)
    values (team, 5, 1, 29000, 5 * 29000) returning id into inv;
  perform settle_team_invoice(inv);
  select * into after_row from teams where id = team;
  if after_row.seats <> 20 then
    raise exception 'kichikroq buyurtma o''rinlarni kamaytirdi';
  end if;
  raise notice '   ok   a smaller renewal does not take seats away';
end $$;

-- 0028 — notifications
do $$
declare
  uid uuid;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;

  insert into notifications (user_id, kind, handle, title, href)
    values (uid, 'lead', 'NTF001', 'Yangi kontakt', '/kabinet/NTF001');
  raise notice '   ok   a notification can be recorded for an account';

  begin
    insert into notifications (user_id, kind, title) values (uid, 'nimadir', 'X');
    raise exception 'notanish tur qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a kind nothing renders';
  end;

  -- A link that leaves the site would make a notice a redirect anyone could aim.
  begin
    insert into notifications (user_id, kind, title, href)
      values (uid, 'lead', 'X', 'https://evil.example');
    raise exception 'tashqi havola qabul qilindi';
  exception when check_violation then
    raise notice '   ok   rejected: a notification pointing off the site';
  end;

  insert into notification_settings (user_id, telegram_chat_id) values (uid, 12345);
  raise notice '   ok   an account can carry where it wants to be reached';

  begin
    insert into auth.users (id) values (gen_random_uuid());
    insert into notification_settings (user_id, telegram_chat_id)
      values ((select id from auth.users order by id desc limit 1), 12345);
    raise exception 'bitta telegram ikki hisobga bogʻlandi';
  exception when unique_violation then
    raise notice '   ok   rejected: one Telegram account linked twice';
  end;
end $$;

-- 0029 — plan reminders
do $$
declare
  uid uuid;
  due integer;
  expiry timestamptz;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into uid;

  expiry := now() + interval '5 days';
  insert into handles (letters, digits, status, user_id, claimed_at, plan, plan_expires_at)
    values ('REM', '001', 'claimed', uid, now(), 'premium', expiry);
  -- Far enough out that it must not be picked up yet.
  insert into handles (letters, digits, status, user_id, claimed_at, plan, plan_expires_at)
    values ('REM', '002', 'claimed', uid, now(), 'premium', now() + interval '40 days');
  -- Already lapsed: reminding somebody about an expiry that has passed is
  -- telling them the news after the fact.
  insert into handles (letters, digits, status, user_id, claimed_at, plan, plan_expires_at)
    values ('REM', '003', 'claimed', uid, now(), 'premium', now() - interval '1 day');

  select count(*) into due from handles_needing_plan_reminder(7);
  if due <> 1 then
    raise exception 'eslatma kerak boʻlganlar soni notoʻgʻri: %', due;
  end if;
  raise notice '   ok   only a plan running out inside the window is due';

  perform mark_plan_reminded('REM001', expiry);
  select count(*) into due from handles_needing_plan_reminder(7);
  if due <> 0 then
    raise exception 'eslatma ikkinchi marta yuboriladi';
  end if;
  raise notice '   ok   a reminder is sent once, not once a day';

  -- Renewing moves the expiry, which is a new period and a new reminder.
  update handles set plan_expires_at = now() + interval '3 days' where normalized = 'REM001';
  select count(*) into due from handles_needing_plan_reminder(7);
  if due <> 1 then
    raise exception 'yangilangandan keyin eslatma qaytmadi';
  end if;
  raise notice '   ok   renewing earns a fresh reminder next period';
end $$;

-- 0030 — comments
do $$
declare
  owner_id uuid;
  visitor uuid;
  hid uuid;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into owner_id;
  insert into auth.users (id) values (gen_random_uuid()) returning id into visitor;
  insert into handles (letters, digits, status, user_id, claimed_at)
    values ('CMT', '001', 'claimed', owner_id, now()) returning id into hid;

  -- Off until the owner says otherwise.
  if (select comments_open from handles where id = hid) then
    raise exception 'izohlar sukut bo''yicha yoqilgan';
  end if;
  raise notice '   ok   comments are closed until the owner opens them';

  insert into profile_comments (handle_id, author_id, body) values (hid, visitor, 'Zo''r ish');
  raise notice '   ok   a signed-in visitor can leave one';

  begin
    insert into profile_comments (handle_id, author_id, body) values (hid, visitor, 'Yana bitta');
    raise exception 'bitta odam ikki marta yozdi';
  exception when unique_violation then
    raise notice '   ok   rejected: a second comment from the same person';
  end;

  begin
    insert into profile_comments (handle_id, author_id, body) values (hid, visitor, '');
    raise exception 'bo''sh izoh qabul qilindi';
  exception when check_violation or unique_violation then
    raise notice '   ok   rejected: an empty comment';
  end;

  -- Deleting the handle takes its comments with it.
  delete from handles where id = hid;
  if exists (select 1 from profile_comments where handle_id = hid) then
    raise exception 'handle o''chirilgach izohlar qoldi';
  end if;
  raise notice '   ok   comments go with the profile they were left on';
end $$;

-- 0031 — recommendations
do $$
declare
  owner_id uuid;
  a uuid;
  b uuid;
  hid uuid;
  n integer;
begin
  insert into auth.users (id) values (gen_random_uuid()) returning id into owner_id;
  insert into auth.users (id) values (gen_random_uuid()) returning id into a;
  insert into auth.users (id) values (gen_random_uuid()) returning id into b;
  insert into handles (letters, digits, status, user_id, claimed_at)
    values ('REC', '001', 'claimed', owner_id, now()) returning id into hid;

  insert into recommendations (handle_id, user_id) values (hid, a), (hid, b);
  select recommend_count into n from handles where id = hid;
  if n <> 2 then raise exception 'hisoblagich notoʻgʻri: %', n; end if;
  raise notice '   ok   the counter follows the rows';

  begin
    insert into recommendations (handle_id, user_id) values (hid, a);
    raise exception 'bir odam ikki marta tavsiya qildi';
  exception when unique_violation then
    raise notice '   ok   rejected: the same person recommending twice';
  end;

  -- Taking it back is a delete, and the counter has to come with it.
  delete from recommendations where handle_id = hid and user_id = a;
  select recommend_count into n from handles where id = hid;
  if n <> 1 then raise exception 'olib tashlangach hisoblagich notoʻgʻri: %', n; end if;
  raise notice '   ok   withdrawing one takes the counter down with it';

  -- A deleted account takes its recommendation, and the count, with it.
  delete from auth.users where id = b;
  select recommend_count into n from handles where id = hid;
  if n <> 0 then raise exception 'hisob oʻchirilgach hisoblagich notoʻgʻri: %', n; end if;
  raise notice '   ok   a deleted account stops counting';
end $$;

-- 0032 — venue enquiries share the team_requests queue
do $$
begin
  -- A company still counts staff and nothing about it changed.
  insert into team_requests (company, contact_name, phone, team_size)
    values ('Test MCHJ', 'Aziz', '+998901234567', 20);
  raise notice '   ok   a company request still counts staff';

  -- A venue counts points instead, and leaves team_size empty.
  insert into team_requests (company, contact_name, phone, points, vertical)
    values ('Test Kafe', 'Sardor', '+998901234567', 12, 'cafe');
  raise notice '   ok   a venue request counts points';

  -- Dropping the NOT NULL must not let through a row that counts nothing:
  -- nobody can quote against "a company would like something".
  begin
    insert into team_requests (company, contact_name, phone)
      values ('Hech nima', 'Kimdir', '+998901234567');
    raise exception 'hech narsani sanamaydigan soʻrov oʻtdi';
  exception when check_violation then
    raise notice '   ok   rejected: a request that counts neither staff nor points';
  end;

  begin
    insert into team_requests (company, contact_name, phone, points, vertical)
      values ('Test', 'Kimdir', '+998901234567', 5, 'kazino');
    raise exception 'notanish yoʻnalish oʻtdi';
  exception when check_violation then
    raise notice '   ok   rejected: a vertical we do not sell';
  end;

  begin
    insert into team_requests (company, contact_name, phone, points)
      values ('Test', 'Kimdir', '+998901234567', 0);
    raise exception 'nol nuqtali soʻrov oʻtdi';
  exception when check_violation then
    raise notice '   ok   rejected: a venue with no points';
  end;

  delete from team_requests where company in ('Test MCHJ', 'Test Kafe');
end $$;

-- 0034 — shops are a vertical, cars are not
do $$
begin
  insert into team_requests (company, contact_name, phone, points, vertical)
    values ('Test Market', 'Bekzod', '+998901234567', 2, 'shop');
  raise notice '   ok   a shop request counts points';

  -- Cars moved to the personal side, so the word is gone rather than kept
  -- for compatibility with rows that never existed.
  begin
    insert into team_requests (company, contact_name, phone, points, vertical)
      values ('Test', 'Kimdir', '+998901234567', 5, 'auto');
    raise exception 'olib tashlangan yoʻnalish oʻtdi';
  exception when check_violation then
    raise notice '   ok   rejected: a vertical we no longer sell';
  end;

  delete from team_requests where company = 'Test Market';
end $$;

-- 0035 — sign-in codes
do $$
declare
  ok boolean;
begin
  insert into telegram_logins (code, expires_at) values ('AB2C3D', now() + interval '5 minutes');
  raise notice '   ok   a sign-in code can be issued with nobody attached yet';

  begin
    insert into telegram_logins (code, expires_at) values ('abc123', now() + interval '5 minutes');
    raise exception 'kichik harfli kod oʻtdi';
  exception when check_violation then
    raise notice '   ok   rejected: a code outside the alphabet we issue';
  end;

  -- O and 0, I and 1 are not in the alphabet precisely because they are read
  -- off one screen and typed into another.
  begin
    insert into telegram_logins (code, expires_at) values ('ABO0ID', now() + interval '5 minutes');
    raise exception 'chalkash harfli kod oʻtdi';
  exception when check_violation then
    raise notice '   ok   rejected: the characters people mistype';
  end;

  begin
    insert into telegram_logins (code, expires_at) values ('AB2C3D', now() + interval '5 minutes');
    raise exception 'bitta kod ikki marta oʻtdi';
  exception when unique_violation then
    raise notice '   ok   rejected: the same code twice';
  end;

  -- Claiming is a filtered update: a second attempt matches nothing.
  update telegram_logins set chat_id = 42, display_name = 'Sinov' where code = 'AB2C3D';

  update telegram_logins set consumed_at = now()
    where code = 'AB2C3D' and chat_id is not null and consumed_at is null
      and expires_at > now();
  get diagnostics ok = row_count;
  if not ok then raise exception 'birinchi olish ishlamadi'; end if;

  update telegram_logins set consumed_at = now()
    where code = 'AB2C3D' and chat_id is not null and consumed_at is null
      and expires_at > now();
  get diagnostics ok = row_count;
  if ok then raise exception 'ishlatilgan kod ikkinchi marta oʻtdi'; end if;
  raise notice '   ok   a code is spent by the first exchange, not the second';

  delete from telegram_logins where code = 'AB2C3D';
end $$;
