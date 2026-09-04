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
