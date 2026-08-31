#!/usr/bin/env bash
# Replays every migration against a throwaway Postgres container and asserts
# that the schema rejects bad data. Catches broken SQL and weakened
# constraints before they reach the real project.
#
# Usage: npm run db:test

set -euo pipefail

CONTAINER=flex-pg-test
IMAGE=postgres:16-alpine
DB=flex
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

if ! docker info >/dev/null 2>&1; then
  echo "Docker isn't running — start Docker Desktop and try again." >&2
  exit 1
fi

cleanup
echo "Starting $IMAGE ..."
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB="$DB" \
  -p 55432:5432 "$IMAGE" >/dev/null

# pg_isready reports success while the server is still finishing its own
# start-up, so wait on a query that actually needs the database to be up.
ready=false
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" psql -U postgres -d "$DB" -c 'select 1' >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done

if [ "$ready" != true ]; then
  echo "Postgres did not become ready in time." >&2
  exit 1
fi

run() { docker exec -i "$CONTAINER" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q; }

# The assertion file returns a row per check; only its NOTICE lines (on stderr)
# are worth showing, so drop the blank result rows from stdout.
run_quiet() {
  docker exec -i "$CONTAINER" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -qtA | grep -v '^$' || true
}

echo "Applying Supabase shim ..."
run < "$ROOT/supabase/test/local-shim.sql"

for file in "$ROOT"/supabase/migrations/*.sql; do
  echo "Applying $(basename "$file") ..."
  run < "$file"
done

echo "Checking constraints ..."
run_quiet < "$ROOT/supabase/test/constraints.sql"

echo
echo "Schema OK — all migrations applied and every constraint held."
