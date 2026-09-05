-- What an owner does with the contacts they have collected.
--
-- A lead is a row somebody left on a public form; these are the owner's own
-- notes on it. Ownership is joined through `handles` everywhere.

-- name: UpdateLead :execrows
update leads l set
  status = coalesce(sqlc.narg(status), l.status),
  owner_note = coalesce(sqlc.narg(owner_note), l.owner_note),
  follow_up_on = coalesce(sqlc.narg(follow_up_on), l.follow_up_on),
  tags = coalesce(sqlc.narg(tags), l.tags),
  last_touch_at = now()
from handles h
where h.id = l.handle_id and l.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: AddLeadByOwner :one
-- Somebody the owner met and typed in themselves, rather than one who filled
-- in the form. Same table: a contact is a contact.
insert into leads (handle_id, name, phone, email, company, note, source)
select h.id, sqlc.arg(name), sqlc.narg(phone), sqlc.narg(email),
       sqlc.narg(company), sqlc.narg(note), 'manual'
from handles h
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning id;

-- name: Brief :one
select b.* from network_briefs b
join handles h on h.id = b.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id);

-- name: SaveBrief :exec
insert into network_briefs (handle_id, summary, suggestions, contacts_seen, built_at)
select h.id, sqlc.arg(summary), sqlc.arg(suggestions), sqlc.arg(contacts_seen), now()
from handles h
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
on conflict (handle_id) do update set
  summary = excluded.summary, suggestions = excluded.suggestions,
  contacts_seen = excluded.contacts_seen, built_at = now();

-- name: DeleteBrief :exec
delete from network_briefs b
using handles h
where h.id = b.handle_id
  and h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id);

-- Dizayn so'rovlari ----------------------------------------------------------

-- name: DesignRequests :many
select * from design_requests
where handle = sqlc.arg(handle) and user_id = sqlc.arg(user_id)
order by created_at desc;

-- name: CreateDesignRequest :one
insert into design_requests (handle, user_id, wish, prompt)
select h.normalized, sqlc.arg(user_id), sqlc.arg(wish), sqlc.narg(prompt)
from handles h
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning *;
