-- A name to sign in with, for the people who run the panel.
--
-- The address stays the identity: `auth.users` is joined on it everywhere, the
-- allow-list is written in addresses, and a receipt has to reach somebody. This
-- is only a second key to the same door — an operator types `admin`, not the
-- mailbox they happened to open the account with.
--
-- It lives beside the hash rather than on the account because that is what it
-- is for. Somebody who never opens the panel has no password and needs no name
-- to type; giving every customer a username would create a namespace to police
-- and squat, for a field nobody outside this table would ever read.
--
-- Lowercase and narrow on purpose. `Admin` and `admin` reaching different rows
-- is how one operator locks another out of a name they think they hold, and a
-- name that only differs by case is a name two people can be told apart by in
-- an audit log and not on a screen.

-- +goose Up

alter table flex_passwords
  add column if not exists username text unique
    check (username ~ '^[a-z0-9_]{3,32}$');

-- +goose Down

alter table flex_passwords drop column if exists username;
