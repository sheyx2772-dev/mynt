-- A tag stuck to an object: a table, a room, a shelf. Somebody taps it and
-- says something, and it reaches whoever owns the number.

-- name: TagByToken :one
-- The token is the whole credential, the way the counter link is.
select t.*, h.normalized from object_tags t
join handles h on h.id = t.handle_id
where t.token = sqlc.arg(token) and t.active;

-- name: TagsForHandle :many
select t.*,
       (select count(*) from tag_messages m where m.tag_id = t.id and m.read_at is null)::bigint as unread
from object_tags t
join handles h on h.id = t.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
order by t.created_at desc;

-- name: CreateTag :one
insert into object_tags (handle_id, token, kind, label)
select h.id, sqlc.arg(token), sqlc.arg(kind), sqlc.arg(label)
from handles h
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning *;

-- name: SetTagActive :execrows
update object_tags t set active = sqlc.arg(active)
from handles h
where h.id = t.handle_id and t.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: CreateTagMessage :one
insert into tag_messages (tag_id, kind, body, reply_to, place, ip)
select t.id, sqlc.arg(kind), sqlc.arg(body), sqlc.narg(reply_to), sqlc.narg(place), sqlc.narg(ip)
from object_tags t
where t.token = sqlc.arg(token) and t.active
returning *;

-- name: TagMessages :many
select m.*, t.label, t.id as tag_id_out from tag_messages m
join object_tags t on t.id = m.tag_id
join handles h on h.id = t.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
order by m.created_at desc
limit sqlc.arg(page_size)::int;

-- name: MarkTagMessagesRead :exec
update tag_messages m set read_at = now()
from object_tags t, handles h
where t.id = m.tag_id and h.id = t.handle_id
  and h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
  and m.read_at is null;

-- name: CountUnreadTagMessages :one
select count(*) from tag_messages m
join object_tags t on t.id = m.tag_id
join handles h on h.id = t.handle_id
where h.normalized = sqlc.arg(handle) and m.read_at is null;

-- Raqamni o'tkazish ----------------------------------------------------------

-- name: TransfersForHandle :many
select * from handle_transfers
where handle = sqlc.arg(handle) and from_user_id = sqlc.arg(user_id)
order by created_at desc;

-- name: IncomingTransfers :many
select t.* from handle_transfers t
join auth.users u on lower(u.email) = lower(t.to_email)
where u.id = sqlc.arg(user_id) and t.status = 'pending' and t.expires_at > now()
order by t.created_at desc;

-- name: OfferTransfer :one
insert into handle_transfers (handle, from_user_id, to_email, expires_at)
select h.normalized, sqlc.arg(user_id), lower(sqlc.arg(to_email)), now() + interval '7 days'
from handles h
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id) and h.status = 'claimed'
returning *;

-- name: CancelTransfer :execrows
update handle_transfers set status = 'cancelled', settled_at = now()
where id = sqlc.arg(id) and from_user_id = sqlc.arg(user_id) and status = 'pending';

-- name: AcceptTransfer :one
-- One statement, and it has to be: a transfer marked accepted without the
-- number moving is a number nobody owns.
update handle_transfers t set status = 'accepted', to_user_id = sqlc.arg(user_id), settled_at = now()
from auth.users u
where t.id = sqlc.arg(id) and u.id = sqlc.arg(user_id)
  and lower(u.email) = lower(t.to_email)
  and t.status = 'pending' and t.expires_at > now()
returning t.handle;

-- name: MoveHandle :execrows
update handles set user_id = sqlc.arg(user_id), updated_at = now()
where normalized = sqlc.arg(handle);
