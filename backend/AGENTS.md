# backend

Go, Postgres, and nothing between them but SQL you can read.

## The loop

```bash
make db          # Postgres in Docker, on 127.0.0.1:5432
make migrate     # apply pending migrations
make dev         # run the API from source on :8090
make check       # vet, build, test — what CI runs
```

`make` on its own lists everything.

## Adding a query

Write the SQL in `db/queries/`, then `make sqlc`. That generates
`internal/store` — typed Go functions, one per named query — and type-checks
every statement against the migrations while it does it, so a query naming a
column that no longer exists fails the generate rather than a request.

**Never edit `internal/store` by hand.** It says so at the top of every file
and the next `make sqlc` would discard the change anyway.

There is no ORM here on purpose. An ORM asks you to describe the data in Go
and then writes SQL nobody read; this project already had two and a half
thousand lines of hand-written SQL that does exactly what it means to, and
sqlc keeps that the source.

## Adding a migration

```bash
go tool goose -dir db/migrations create what_it_does sql
```

Then write it, and `make migrate`. Two rules the tool will not enforce:

A migration that has been applied anywhere is never edited. It is the record
of what was done; correcting it means a new file that corrects it.

A function body, or anything else containing a semicolon inside a quoted body,
needs `-- +goose StatementBegin` and `-- +goose StatementEnd` around it. goose
splits on semicolons and will otherwise hand Postgres half a function.

## Adding an endpoint

`huma.Register` in `internal/api`, with the operation described in the struct
rather than in a comment. That description is what produces the OpenAPI
document at `/v1/openapi.json`, which is what the admin panel's TypeScript
types and the app's Dart client are generated from — so a field renamed here
breaks their builds instead of their users.

Everything is under `/v1`. Three clients read this API and they update on their
own schedules; an app store review can take a week, so there has to be
somewhere for a second version to live that is not on top of the first.

## What the code assumes

**Nothing reads an environment variable except `internal/config`.** A value
that is missing or malformed stops the process at boot with a sentence naming
it, rather than surfacing as a nil pointer inside a handler at three in the
morning.

**A request's identity comes from its session, never from its body.** A user
id in a payload is a claim the sender made about themselves. The only id a
handler acts on is the one `TouchSession` returned.

**Errors returned to a caller carry no internals.** A database error string
can hold a host name, a user name and a query. It goes to the log; the caller
gets a sentence in Uzbek.
