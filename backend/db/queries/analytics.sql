-- Counting visits without keeping anything that identifies a visitor.

-- name: RecordProfileView :exec
insert into profile_views (handle, visitor_hash, referrer_host, source)
values (sqlc.arg(handle), sqlc.narg(visitor_hash), sqlc.narg(referrer_host), sqlc.narg(source));

-- name: RecordLinkClick :exec
insert into link_clicks (handle, label, visitor_hash)
values (sqlc.arg(handle), sqlc.arg(label), sqlc.narg(visitor_hash));

-- name: IncrementViewCount :exec
select increment_view_count(sqlc.arg(handle));

-- name: HandleStats :many
select * from handle_stats(sqlc.arg(handle), sqlc.arg(days)::int);

-- name: HandleLinkStats :many
select * from handle_link_stats(sqlc.arg(handle), sqlc.arg(days)::int);

-- name: HandleSourceStats :many
select * from handle_source_stats(sqlc.arg(handle), sqlc.arg(days)::int);
