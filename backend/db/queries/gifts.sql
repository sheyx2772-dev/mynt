-- Sovg'alar.
--
-- The order is placed against a claimed number and delivered when it is paid.
-- Ownership of the shelf is a join through `handles` where it matters: only
-- the recipient may hide a gift, and only they see the hidden ones.

-- name: PlaceGiftOrder :one
-- A gift for a claimed number. The recipient condition is on the insert, so a
-- gift to a number nobody holds writes nothing.
insert into orders (user_id, handle, amount, kind, sticker, gift_note)
select sqlc.arg(user_id), h.normalized, sqlc.arg(amount), 'gift', sqlc.arg(sticker), sqlc.narg(note)
from handles h
where h.normalized = sqlc.arg(handle) and h.status = 'claimed'
returning *;

-- name: DeliverGift :one
-- Written from the order rather than from the request, and once: the unique
-- order_id makes a provider retry a no-op.
insert into gifts (order_id, handle, from_user_id, sticker, note)
select o.id, o.handle, o.user_id, o.sticker, coalesce(o.gift_note, '')
from orders o
where o.id = sqlc.arg(order_id) and o.kind = 'gift' and o.sticker is not null
on conflict (order_id) do nothing
returning id, handle, from_user_id, sticker, note;

-- name: WithdrawGift :exec
-- A refund takes the gift back off the shelf. The order stays as the record.
delete from gifts where order_id = sqlc.arg(order_id);

-- name: Gifts :many
-- The shelf, newest first. Hidden ones only when the reader is the owner,
-- and flagged, so the owner's screen can offer to show them again.
select g.id, g.sticker, g.note, g.korsatiladi, g.created_at, g.from_user_id,
       sender.normalized as sender_handle, sender.owner_name as sender_name, sender.avatar_url as sender_avatar
from gifts g
left join handles sender on sender.user_id = g.from_user_id and sender.status = 'claimed'
where g.handle = sqlc.arg(handle)
  and (g.korsatiladi or sqlc.arg(include_hidden)::bool)
order by g.created_at desc
limit sqlc.arg(page_size)::int;

-- name: GiftCounts :many
-- How many of each, for the tiles. Hidden ones do not count.
select sticker, count(*) as soni
from gifts
where handle = sqlc.arg(handle) and korsatiladi
group by sticker
order by soni desc, sticker;

-- name: SetGiftShown :execrows
-- The owner's switch. The ownership join is the authorization: somebody
-- else's gift, or somebody else's number, matches nothing.
update gifts g
set korsatiladi = sqlc.arg(shown)
from handles h
where h.normalized = g.handle and h.user_id = sqlc.arg(owner_id)
  and g.id = sqlc.arg(id) and g.handle = sqlc.arg(handle);

-- name: GiftRecipient :one
-- Whom to tell when one lands.
select user_id, owner_name from handles
where normalized = sqlc.arg(handle) and status = 'claimed';

-- name: SenderName :one
-- What the recipient is told: the sender's own number's name, or nothing.
select owner_name from handles
where user_id = sqlc.arg(user_id) and status = 'claimed'
order by claimed_at asc nulls last
limit 1;
