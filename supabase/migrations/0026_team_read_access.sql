-- Flex migration 0026 — fixing how a company row is read.
--
-- 0024 gave teams a policy that checked team_members, and team_members a policy
-- that checked teams. Postgres answered "infinite recursion detected in policy
-- for relation teams", and because the profile page reads the company through
-- an embed, every card belonging to a company rendered as an unclaimed number.
-- Found by loading one.
--
-- The recursion was a symptom of the wrong tool. Row level security answers
-- "which rows", and the real question here is "which columns": a company's name
-- and logo are printed on a card anyone can tap, while its seat count and its
-- owner's id are nobody's business. Column grants say exactly that, and need no
-- policy that can recurse.
--
-- Everything administrative — the seats, the members, the roster — is read with
-- the service role in `getTeamForUser`, which never consults these policies.

drop policy if exists teams_member_reads on teams;
drop policy if exists team_members_self_reads on team_members;

-- The brand is public because it is printed on a public card.
create policy teams_brand_is_public on teams for select using (true);

revoke select on teams from anon, authenticated;
grant select (id, name, logo_url, website, city, plan_expires_at) on teams to anon, authenticated;

-- Membership is administrative and has no public half: service role only, as
-- with claim_attempts and lead_attempts.
revoke all on team_members from anon, authenticated;
