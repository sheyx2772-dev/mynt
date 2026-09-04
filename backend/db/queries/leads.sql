-- Contacts left on a profile, and the counters that stop the form being abused.

-- name: LeadsForHandle :many
select l.* from leads l
join handles h on h.id = l.handle_id
where h.normalized = sqlc.arg(normalized)
  and h.user_id = sqlc.arg(user_id)
order by l.created_at desc
limit 500;

-- name: CreateLead :one
insert into leads (handle_id, name, phone, email, company, note, source)
select h.id, sqlc.arg(name), sqlc.narg(phone), sqlc.narg(email),
       sqlc.narg(company), sqlc.narg(note), sqlc.narg(source)
from handles h
where h.normalized = sqlc.arg(normalized) and h.status = 'claimed'
returning *;

-- A person may ask for their details to be removed, and the owner has to be
-- able to do it. Ownership is in the query, as everywhere else.
-- name: DeleteLead :execrows
delete from leads
where leads.id = sqlc.arg(id)
  and leads.handle_id in (
    select h.id from handles h
    where h.normalized = sqlc.arg(normalized) and h.user_id = sqlc.arg(user_id)
  );

-- name: CountRecentLeadAttemptsByIP :one
select count(*) from lead_attempts
where ip = sqlc.arg(ip)
  and created_at > now() - sqlc.arg(window_seconds)::int * interval '1 second';

-- name: CountRecentLeadAttemptsByHandle :one
select count(*) from lead_attempts
where handle = sqlc.arg(handle)
  and created_at > now() - sqlc.arg(window_seconds)::int * interval '1 second';

-- A refused attempt is recorded too, so hammering the limit does not reset it.
-- name: RecordLeadAttempt :exec
insert into lead_attempts (ip, handle, succeeded)
values (sqlc.narg(ip), sqlc.arg(handle), sqlc.arg(succeeded));
