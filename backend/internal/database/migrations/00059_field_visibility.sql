-- Who sees which line of a profile.
--
-- A closed profile (00058) is one switch for everything. This is the finer
-- one: a phone number for followers only, an Instagram for everybody, an
-- email for nobody but the owner. One map on the row, keyed by the field —
-- `telegram`, `telefon`, `email` and the rest — with the value naming the
-- narrowest audience: `obuna` (followers) or `yopiq` (owner only). A field
-- absent from the map is open, so an empty map is exactly the profile as it
-- was before, and no existing row changes meaning.
--
-- The links themselves stay in `links`. Keying the map by field rather than
-- storing an audience on each link means the audience survives the link being
-- retyped, which is what happens every time the edit form is saved.

-- +goose Up

alter table handles
  add column if not exists korinish jsonb not null default '{}'::jsonb;

-- +goose Down

alter table handles drop column if exists korinish;
