#!/usr/bin/env bash
# Replays every migration against a throwaway Postgres container and asserts
# that the schema rejects bad data. Catches broken SQL and weakened
# constraints before they reach the real project.
#
# Usage: npm run db:test

set -euo pipefail

CONTAINER=mynt-pg-test
IMAGE=postgres:16-alpine
DB=mynt
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

for _ in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

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
