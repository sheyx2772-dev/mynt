-- Reading and writing a number.
--
-- Ownership is a filter on the query, never a check in Go afterwards. A number
-- somebody else owns comes back as no rows, which is the same answer an
-- invented number gives — so a guesser learns nothing either way.

-- name: HandlesForUser :many
select * from handles
where user_id = sqlc.arg(user_id)
order by claimed_at desc nulls last;

-- name: OwnedHandle :one
select * from handles
where normalized = sqlc.arg(normalized)
  and user_id = sqlc.arg(user_id);

-- The company holding a number, when one does.
--
-- Read separately rather than joined into the two above: sqlc flattens a join
-- into a new row type, and the two would then need their own copy of a
-- thirty-field mapping. Most numbers belong to a person and never ask.
-- name: TeamNames :many
select id, name from teams where id = any(sqlc.arg(ids)::uuid[]);

-- What a visitor sees. Only claimed numbers: a reservation is an unfinished
-- purchase, not a profile.
-- name: PublicProfile :one
select normalized, user_id, owner_name, bio, avatar_url, banner_url, links, services,
       city, contact_email, phone, position, company, tags,
       card_design, device_type, custom_design_url,
       plan, plan_expires_at, view_count, last_seen_at,
       yopiq, follower_count, korinish
from handles
where normalized = sqlc.arg(normalized) and status = 'claimed';

-- The columns a profile is made of, and no others.
--
-- `plan`, `status`, `user_id`, `price_paid` and `custom_design_url` are absent
-- on purpose: they are what somebody would set if they could, and none of them
-- is part of editing a profile. The `user_id` filter is the authorization.
-- name: UpdateProfile :one
update handles set
  owner_name = sqlc.arg(owner_name),
  bio = sqlc.narg(bio),
  links = sqlc.arg(links),
  services = sqlc.arg(services),
  city = sqlc.narg(city),
  contact_email = sqlc.narg(contact_email),
  phone = sqlc.narg(phone),
  position = sqlc.narg(position),
  company = sqlc.narg(company),
  tags = sqlc.arg(tags),
  card_design = sqlc.arg(card_design),
  device_type = sqlc.arg(device_type),
  -- Pictures and the comments switch. The two images are addresses the caller
  -- uploaded before asking; nothing here fetches or trusts what is at them.
  avatar_url = sqlc.narg(avatar_url),
  banner_url = sqlc.narg(banner_url),
  comments_open = sqlc.arg(comments_open),
  yopiq = sqlc.arg(yopiq),
  korinish = sqlc.arg(korinish)
where normalized = sqlc.arg(normalized)
  and user_id = sqlc.arg(user_id)
returning *;

-- name: SetAvatar :exec
update handles set avatar_url = sqlc.narg(avatar_url)
where normalized = sqlc.arg(normalized) and user_id = sqlc.arg(user_id);

-- Stamps the owner's numbers as recently active, which a profile shows.
-- name: TouchLastSeen :exec
update handles set last_seen_at = now() where user_id = sqlc.arg(user_id);

-- name: GenesisCard :one
select * from genesis_cards where normalized = sqlc.arg(normalized);
