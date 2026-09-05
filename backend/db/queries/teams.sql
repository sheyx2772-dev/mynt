-- A company: its numbers, its people, and what it is billed.
--
-- Membership is the authorisation everywhere here. A number held by a company
-- is edited by whoever holds it and released by the company, and those are
-- different people — so the two are different statements rather than one with
-- a flag.

-- name: TeamForUser :one
select t.*, m.role from teams t
join team_members m on m.team_id = t.id
where m.user_id = sqlc.arg(user_id)
limit 1;

-- name: TeamHandles :many
select h.normalized, h.owner_name, h.position, h.view_count, h.status,
       h.claimed_at, h.user_id, u.email as holder
from handles h
left join auth.users u on u.id = h.user_id
where h.team_id = sqlc.arg(team_id)
order by h.claimed_at desc nulls last;

-- name: TeamStats :one
select
  count(*)::bigint as taken,
  count(*) filter (where user_id is not null)::bigint as assigned,
  coalesce(sum(view_count), 0)::bigint as views
from handles where team_id = sqlc.arg(team_id);

-- name: ReleaseTeamHandle :execrows
-- Taking a number back from somebody who has left. The number stays with the
-- company; only the holder is cleared.
update handles h set user_id = null, updated_at = now()
from team_members m
where m.team_id = h.team_id
  and h.normalized = sqlc.arg(handle)
  and m.user_id = sqlc.arg(user_id) and m.role = 'owner';

-- name: TeamHandleForAssign :one
-- The number must be this company's and nobody's. Reassigning an occupied
-- number silently would take somebody's profile away without the wipe that
-- offboarding does deliberately.
select h.normalized, h.user_id, t.seats,
       (select count(*) from handles x where x.team_id = t.id and x.user_id is not null)::bigint as filled
from handles h
join teams t on t.id = h.team_id
join team_members m on m.team_id = t.id
where h.normalized = sqlc.arg(handle)
  and m.user_id = sqlc.arg(user_id) and m.role = 'owner';

-- name: AssignTeamHandle :execrows
update handles h set user_id = sqlc.arg(to_user), claimed_at = coalesce(h.claimed_at, now()),
                     status = 'claimed', updated_at = now()
from team_members m
where m.team_id = h.team_id
  and h.normalized = sqlc.arg(handle)
  and m.user_id = sqlc.arg(user_id) and m.role = 'owner';

-- name: TeamInvoices :many
select i.* from team_invoices i
join team_members m on m.team_id = i.team_id
where m.user_id = sqlc.arg(user_id)
order by i.issued_at desc;

-- name: TeamInvoice :one
select i.* from team_invoices i
join team_members m on m.team_id = i.team_id
where i.id = sqlc.arg(id) and m.user_id = sqlc.arg(user_id);

-- name: IssueTeamInvoice :one
insert into team_invoices (team_id, seats, months, seat_monthly, vat_percent, total)
select m.team_id, sqlc.arg(seats), sqlc.arg(months), sqlc.arg(seat_monthly),
       sqlc.arg(vat_percent), sqlc.arg(total)
from team_members m
where m.user_id = sqlc.arg(user_id) and m.role = 'owner'
returning *;

-- name: SaveRequisites :execrows
-- What goes on an invoice. Only the company's owner may change it: an invoice
-- with somebody else's bank details on it is a fraud with our name on the top.
update teams t set
  legal_name = sqlc.narg(legal_name), inn = sqlc.narg(inn), address = sqlc.narg(address),
  bank_name = sqlc.narg(bank_name), bank_account = sqlc.narg(bank_account),
  bank_mfo = sqlc.narg(bank_mfo), director = sqlc.narg(director), updated_at = now()
from team_members m
where m.team_id = t.id and m.user_id = sqlc.arg(user_id) and m.role = 'owner';

-- name: CreateTeamRequest :one
insert into team_requests (company, contact_name, phone, email, team_size, note, vertical, points)
values (sqlc.arg(company), sqlc.arg(contact_name), sqlc.arg(phone), sqlc.narg(email),
        sqlc.narg(team_size), sqlc.narg(note), sqlc.narg(vertical), sqlc.narg(points))
returning id;
