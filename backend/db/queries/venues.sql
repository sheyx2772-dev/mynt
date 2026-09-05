-- A venue: a cafe, a hotel, a shop. The menu it publishes, the points it has
-- printed, and what a guest standing at one has asked for.
--
-- Every write is filtered through `handles.user_id`, so a venue somebody else
-- owns is no rows rather than a check in Go afterwards.

-- name: VenueByHandle :one
select v.* from venues v
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle);

-- name: OwnedVenue :one
select v.* from venues v
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id);

-- name: VenueByStaffToken :one
-- The counter link. The token is the whole of the authorisation, which is why
-- it is long and why rotating it is one statement.
select v.*, h.normalized from venues v
join handles h on h.id = v.handle_id
where v.staff_token = sqlc.arg(token);

-- name: CreateVenue :one
insert into venues (handle_id, name, kind, plan_expires_at)
select h.id, sqlc.arg(name), sqlc.arg(kind), now() + interval '30 days'
from handles h
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning *;

-- name: SaveVenue :one
update venues v set
  name = sqlc.arg(name), kind = sqlc.arg(kind),
  hours = sqlc.narg(hours), address = sqlc.narg(address),
  wifi_name = sqlc.narg(wifi_name), wifi_password = sqlc.narg(wifi_password),
  updated_at = now()
from handles h
where h.id = v.handle_id
  and h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning v.*;

-- name: SavePoints :one
update venues v set points = sqlc.arg(points), updated_at = now()
from handles h
where h.id = v.handle_id
  and h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning v.*;

-- name: RotateStaffToken :one
update venues v set staff_token = sqlc.arg(token), updated_at = now()
from handles h
where h.id = v.handle_id
  and h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning v.staff_token;

-- Menyu ----------------------------------------------------------------------

-- name: MenuCategories :many
select * from menu_categories where venue_id = sqlc.arg(venue_id)
order by position, created_at;

-- name: MenuItems :many
select * from menu_items where venue_id = sqlc.arg(venue_id)
order by position, created_at;

-- name: MenuItem :one
select i.* from menu_items i
join venues v on v.id = i.venue_id
join handles h on h.id = v.handle_id
where i.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: MenuCategoryOwned :one
select c.* from menu_categories c
join venues v on v.id = c.venue_id
join handles h on h.id = v.handle_id
where c.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: CountMenuItems :one
select count(*) from menu_items where venue_id = sqlc.arg(venue_id);

-- name: AddCategory :one
insert into menu_categories (venue_id, name, name_ru, name_en, position)
select v.id, sqlc.arg(name), sqlc.narg(name_ru), sqlc.narg(name_en),
       coalesce((select max(position) + 1 from menu_categories where venue_id = v.id), 0)
from venues v
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning *;

-- name: EditCategory :execrows
update menu_categories c set
  name = sqlc.arg(name), name_ru = sqlc.narg(name_ru), name_en = sqlc.narg(name_en)
from venues v
join handles h on h.id = v.handle_id
where v.id = c.venue_id and c.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: RemoveCategory :execrows
delete from menu_categories c
using venues v, handles h
where v.id = c.venue_id and h.id = v.handle_id
  and c.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: MoveCategory :execrows
update menu_categories c set position = sqlc.arg(position)
from venues v
join handles h on h.id = v.handle_id
where v.id = c.venue_id and c.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: AddItem :one
insert into menu_items (venue_id, category_id, name, name_ru, name_en,
                        note, note_ru, note_en, price, position)
select v.id, sqlc.narg(category_id), sqlc.arg(name), sqlc.narg(name_ru), sqlc.narg(name_en),
       sqlc.narg(note), sqlc.narg(note_ru), sqlc.narg(note_en), sqlc.arg(price),
       coalesce((select max(position) + 1 from menu_items where venue_id = v.id), 0)
from venues v
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning *;

-- name: EditItem :execrows
update menu_items i set
  category_id = sqlc.narg(category_id), name = sqlc.arg(name),
  name_ru = sqlc.narg(name_ru), name_en = sqlc.narg(name_en),
  note = sqlc.narg(note), note_ru = sqlc.narg(note_ru), note_en = sqlc.narg(note_en),
  price = sqlc.arg(price), updated_at = now()
from venues v
join handles h on h.id = v.handle_id
where v.id = i.venue_id and i.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: SetItemAvailable :execrows
update menu_items i set available = sqlc.arg(available), updated_at = now()
from venues v
join handles h on h.id = v.handle_id
where v.id = i.venue_id and i.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: SetItemPhoto :execrows
update menu_items i set photo_url = sqlc.narg(photo_url), updated_at = now()
from venues v
join handles h on h.id = v.handle_id
where v.id = i.venue_id and i.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: MoveItem :execrows
update menu_items i set position = sqlc.arg(position), updated_at = now()
from venues v
join handles h on h.id = v.handle_id
where v.id = i.venue_id and i.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- name: RemoveItem :execrows
delete from menu_items i
using venues v, handles h
where v.id = i.venue_id and h.id = v.handle_id
  and i.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- So'rovlar ------------------------------------------------------------------

-- name: CreateVenueRequest :one
insert into venue_requests (venue_id, point, kind, rating, note, ip)
select v.id, sqlc.arg(point), sqlc.arg(kind), sqlc.narg(rating), sqlc.narg(note), sqlc.narg(ip)
from venues v
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle)
returning *;

-- name: VenueRequests :many
select r.* from venue_requests r
join venues v on v.id = r.venue_id
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
  and (sqlc.narg(status)::text is null or r.status = sqlc.narg(status)::text)
order by r.created_at desc
limit sqlc.arg(page_size)::int;

-- name: CountWaitingRequests :one
select count(*) from venue_requests r
join venues v on v.id = r.venue_id
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle) and r.status = 'new';

-- name: CloseVenueRequest :execrows
update venue_requests r set status = 'done', done_at = now()
from venues v
join handles h on h.id = v.handle_id
where v.id = r.venue_id and r.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- Hisob-fakturalar -----------------------------------------------------------

-- name: VenueInvoices :many
select i.* from venue_invoices i
join venues v on v.id = i.venue_id
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
order by i.issued_at desc;

-- name: VenueInvoice :one
select i.* from venue_invoices i
join venues v on v.id = i.venue_id
join handles h on h.id = v.handle_id
where i.id = sqlc.arg(id) and h.user_id = sqlc.arg(user_id);

-- The counter screen, reached by token rather than by session.
-- name: RequestsByToken :many
select r.* from venue_requests r
join venues v on v.id = r.venue_id
where v.staff_token = sqlc.arg(token)
order by r.created_at desc
limit sqlc.arg(page_size)::int;

-- name: CloseRequestByToken :execrows
update venue_requests r set status = 'done', done_at = now()
from venues v
where v.id = r.venue_id and v.staff_token = sqlc.arg(token) and r.id = sqlc.arg(id);

-- The cabinet's venue tab: the number, and how many tables are waiting.
--
-- One statement rather than "find the handles, then find the venue": the join
-- is the question being asked — a venue whose number belongs to this account.
-- name: MyVenueTab :one
select h.normalized,
       (select count(*) from venue_requests r where r.venue_id = v.id and r.status = 'new')::bigint as waiting
from venues v
join handles h on h.id = v.handle_id
where h.user_id = sqlc.arg(user_id)
limit 1;

-- How many times this point has asked lately, and whether the venue is paid up.
-- name: RecentRequestsFromPoint :one
select count(*) from venue_requests r
join venues v on v.id = r.venue_id
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle)
  and r.point = sqlc.arg(point)
  and r.created_at > now() - (sqlc.arg(minutes)::int * interval '1 minute');

-- name: VenuePlanExpiry :one
select v.plan_expires_at from venues v
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle);

-- name: IssueVenueInvoice :one
insert into venue_invoices (venue_id, points, months, monthly, vat_percent, total)
select v.id, sqlc.arg(points), sqlc.arg(months), sqlc.arg(monthly),
       sqlc.arg(vat_percent), sqlc.arg(total)
from venues v
join handles h on h.id = v.handle_id
where h.normalized = sqlc.arg(handle) and h.user_id = sqlc.arg(user_id)
returning *;
