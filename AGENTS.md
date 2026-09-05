# Flex

Four applications, one product. Each folder builds, tests and deploys on its
own; none of them imports from another.

| | | |
|---|---|---|
| `backend/` | Go | The only thing that talks to Postgres. Publishes an OpenAPI document the other three are generated from. |
| `landing/` | Next.js | The public site: the marketing pages and the profile a card opens. Server-rendered, because a tapped card has to arrive fast and be indexable. |
| `admin/` | React + Vite | The cabinet and the admin screens. Behind a sign-in, so nothing is rendered on a server. |
| `mobile/` | Flutter | The phone. Writes NFC tags, reads them, and carries the parts of the cabinet a phone does better than a browser. |

Read the guide inside a folder before working in it. Each one carries its own
`AGENTS.md` where its conventions differ from the obvious.

## Getting the whole thing running

```bash
cd backend  && make schema && make dev                # :8090
cd landing  && npm install && npm run dev            # :3000
cd admin    && npm install && npm run dev            # :5174
cd mobile   && flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8090
```

`make db` starts Postgres in Docker. The backend runs from source rather than
in a container because a rebuild on save is the point of development; `docker
compose up` runs both and is how the image is checked before it is deployed.

## One database, and who owns which part of it

All four applications read the same Postgres, so a number bought on the site
exists in the app. The backend is the only thing that connects to it; the
website, the panel and the phone ask the backend.

The whole schema is `backend/internal/database/migrations` — fifty-five files applied in
order by goose. Forty-seven of them built the product on Supabase and were
moved here when it went; the first stands in for what Supabase provided, an
`auth` schema and three API roles the grants still name; the last seven are
what the backend added for sessions, promotions, passwords and the phone door.
`make migrate` against an empty database produces the product, and sqlc
type-checks every query against those files, so a query naming a column that a
migration removed fails `make sqlc` rather than a request.

`make schema-test` replays them into a scratch database and runs the assertions
in `db/test/constraints.sql`, which check that the schema refuses bad data on
its own — a constraint quietly weakened by a migration written to fix something
else is exactly what that catches.

Identity is `auth.users`, a table this database owns and `internal/auth`
writes. The name is Supabase's and the table is not: renaming it is a migration
and dozens of queries, which is work rather than a decision.

Nothing connects as `anon` or `authenticated`, so the row level security
policies in the older migrations are inert. Who may see what is decided in SQL
that filters — every read joins through `handles` and takes the reader's id as
a parameter — rather than in a policy carried by a role.

## What is true of all four

**No secret is ever committed.** Each application reads its own `.env`, and
each carries a `.env.example` that names the keys without holding them. A key
compiled into a mobile binary is a published key — `strings` on the file is
enough — so the app holds none and authenticates as a person instead.

**Uzbek in the interface, English in the code.** Route names, screen names and
anything a person reads are Uzbek, as the product is. Identifiers, types and
commit messages are English.

**Comments say why, not what.** A line that restates the code is noise; the
reason a thing is done the harder way is what the next person cannot recover
from reading it. Most of the comments in this repository are the second kind
and new ones should be too.

**A file is about one thing, and stays under about 200 lines.** Not a rule
about counting — a file that has grown past it has almost always taken on a
second job, and the fix is to name the second job and give it its own file.
`internal/auth` is sign-in, sessions and tokens in three files rather than one,
and each is openable without scrolling. Generated files are exempt: nobody
reads `internal/store`, and it says so at the top.

**Security decisions get written down where they are made.** Every one of them
in this repository looks like unnecessary work until the paragraph above it
explains what it stops. The paragraph is what stops the next person removing
it, so it is not optional:

- Authorization is a filter on the query, never a check afterwards. A row
  somebody does not own comes back as no rows, and gets the same answer an
  invented one gets — so a guesser learns nothing from the difference.
- A write names the columns it may write. "The owner's own row" is not a
  permission; migration 00048, `lock_down_handle_writes`, is what that mistake
  cost.
- Identity comes from the session. A user id in a body or a query string is a
  claim the sender made about themselves.
- Anything that decides money or ownership is decided on the server, from the
  stored row, never from the request.
- Errors sent to a caller carry no internals. The detail goes to the log.
- Input rendered to other people is rebuilt from validated parts, never
  passed through.
