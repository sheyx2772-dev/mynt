-- The three report functions are gone; the reports are queries now.
--
-- They existed in Supabase because row level security had to be got around.
-- `profile_views` and `link_clicks` carry visitor hashes and referrers that
-- belong to the owner alone, so the tables were closed and the aggregates came
-- out through `security definer` wrappers that the browser's key could not
-- call directly.
--
-- None of that holds here. The browser has no key; the backend is the only
-- thing with a connection, and it checks who owns a number before it asks for
-- its statistics. So the wrapper was defending against a client that no longer
-- exists, and what it cost was real: sqlc cannot see into a set-returning
-- function, so every one of these came back to Go as `interface{}`.
--
-- `increment_view_count` stays. It is not a wrapper — it is a write that has to
-- happen in the same breath as recording the visit.

-- +goose Up

drop function if exists handle_source_stats(text, integer);
drop function if exists handle_link_stats(text, integer);
drop function if exists handle_stats(text, integer);

-- +goose Down

-- Deliberately not recreated. Rolling back to a shape whose only purpose was to
-- satisfy a database we no longer use would be restoring a mistake; if these
-- are ever wanted again, 00003 has them written out.
