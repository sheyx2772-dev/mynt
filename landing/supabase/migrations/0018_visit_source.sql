-- Flex migration 0018 — where a visit came from.
--
-- A tap on a card arrives as a direct navigation with no referrer, which is
-- indistinguishable from somebody typing the address. So the owner could see
-- that their profile was visited and never learn whether the card they paid
-- for is the thing bringing people — which is the one number that tells them
-- the device was worth buying.
--
-- The devices and the QR code carry the source in their URL. Anything else is
-- recorded as null rather than trusted: the parameter is in a link a stranger
-- can edit, so only the values we issue are stored.

alter table profile_views add column if not exists source text
  check (source is null or source in ('nfc', 'qr', 'share'));

create index if not exists profile_views_source_idx
  on profile_views (handle, source, created_at desc);

-- The breakdown the owner sees. Aggregated in a security definer function for
-- the same reason as the rest: profile_views carries visitor hashes and
-- referrers, and the table stays closed.
create or replace function handle_source_stats(p_handle text, p_days integer)
returns table (source text, views bigint) as $$
  select coalesce(source, 'togridan') as source, count(*) as views
  from profile_views
  where handle = p_handle
    and created_at >= now() - make_interval(days => p_days)
  group by 1
  order by 2 desc;
$$ language sql stable security definer;

revoke all on function handle_source_stats(text, integer) from public, anon, authenticated;
