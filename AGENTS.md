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
cd backend  && make db && make migrate && make dev   # :8090
cd landing  && npm install && npm run dev            # :3000
cd admin    && npm install && npm run dev            # :5174
cd mobile   && flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8090
```

`make db` starts Postgres in Docker. The backend runs from source rather than
in a container because a rebuild on save is the point of development; `docker
compose up` runs both and is how the image is checked before it is deployed.

## Where things are in the middle of moving

`landing/` still reads Supabase directly — it was the whole product until the
backend existed, and it keeps working while the backend grows underneath it.
`landing/supabase/` holds the migrations that live database was built from.
`backend/db/migrations/` is the new one, owned by us, and the two are not yet
the same database. Nothing is deleted from the first until the second answers
for it.

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
  permission; `landing/supabase/migrations/0047` is what that mistake cost.
- Identity comes from the session. A user id in a body or a query string is a
  claim the sender made about themselves.
- Anything that decides money or ownership is decided on the server, from the
  stored row, never from the request.
- Errors sent to a caller carry no internals. The detail goes to the log.
- Input rendered to other people is rebuilt from validated parts, never
  passed through.
