-- Flex migration 0047 — an owner may edit their profile, not their plan.
--
-- 0002 gave owners this policy:
--
--   create policy "owners can update their handle" on handles for update
--     using (auth.uid() = user_id) with check (auth.uid() = user_id);
--
-- Row level security answers "which rows", and that is the only question it
-- was asked. It says nothing about which columns, so the policy permits an
-- owner to write every column on their own row — `plan` and `plan_expires_at`
-- among them.
--
-- The anon key is public by design: it ships in every page this site serves.
-- So anyone signed in could open a console and run
--
--   supabase.from('handles').update({ plan: 'premium',
--     plan_expires_at: '2099-01-01' }).eq('normalized', 'THEIR000')
--
-- and take the paid tier for nothing. `status`, `price_paid`, `user_id`,
-- `team_id` and `custom_design_url` were reachable the same way — the last
-- being artwork somebody else paid to have drawn.
--
-- 0023 already revoked `extend_premium` from anon and authenticated, which is
-- the same decision made about the same value through a different door. This
-- closes the door that was left open.
--
-- Nothing in the app loses anything. Every profile write goes through a server
-- action on the service role key, which bypasses both policies and grants, and
-- `src/lib/supabase/client.ts` — the only browser-scoped client — has no
-- callers at all. The single write that runs as the signed-in user is
-- `touchLastSeen`, and it is granted its one column below.
--
-- The policy stays: it is still what decides the row. Grants decide the column,
-- and both must pass. This is the shape 0026 and 0028 already use.

revoke update on handles from anon, authenticated;

-- The cabinet stamps the owner's handles as recently active on every visit.
-- It is the owner's own row, written by the owner, and worth nothing to a
-- forger — so it stays where it is rather than becoming a round trip.
grant update (last_seen_at) on handles to authenticated;

-- Inserts were never granted here — claiming has gone through the server since
-- 0002 so that price and rate limits are enforced in one place — but saying so
-- means a future default privilege cannot quietly hand them over.
revoke insert, delete on handles from anon, authenticated;
