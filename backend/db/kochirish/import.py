"""Load the exported rows into our own Postgres.

Two things make this safe to run rather than a script to read carefully first.

Postgres does the typing. Each table's rows go in as one JSON document through
`json_populate_recordset(null::table, ...)`, so timestamps, arrays and jsonb are
parsed by the database against the real column types instead of being turned
into SQL literals by hand — which is where a data move usually goes wrong, one
column at a time and silently.

Only the columns both sides have are written. A column Supabase never had is
left out of the insert entirely so its default applies, rather than being
written as NULL and failing a NOT NULL that was added after the export.

Tables go in foreign-key order, worked out from the constraints themselves, so
nothing is inserted before what it references.
"""
import json
import pathlib
import subprocess
import sys

S = pathlib.Path(__file__).parent
DATA = S / "sbdata"
DB = sys.argv[1] if len(sys.argv) > 1 else "flex_new"

# The dollar-quote tag. Asserted absent from every payload before it is used.
TAG = "$koch$"
COMPOSE = ["docker", "compose", "exec", "-T", "db"]
BACKEND = "/home/zoyirjon/private/flex/backend"


def psql(sql, database=DB):
    out = subprocess.run(
        COMPOSE + ["psql", "-U", "flex", "-d", database, "-v", "ON_ERROR_STOP=1", "-qtA"],
        input=sql, capture_output=True, text=True, cwd=BACKEND,
    )
    if out.returncode != 0:
        raise SystemExit(f"psql: {out.stderr.strip()[:600]}")
    return out.stdout


def columns():
    """Every column that may be written.

    Generated and always-identity columns are left out: `handles.normalized` is
    computed from the letters and digits, and Postgres refuses a value for it.
    They are not data to move — they are data derived from what is moved.
    """
    rows = psql("""
        select table_schema || '.' || table_name || '|' || column_name
        from information_schema.columns
        where table_schema in ('public','auth')
          and is_generated <> 'ALWAYS'
          and coalesce(identity_generation, '') <> 'ALWAYS'
    """)
    out = {}
    for line in rows.splitlines():
        table, column = line.split("|")
        out.setdefault(table, set()).add(column)
    return out


def order(names):
    """Foreign-key order, parents before children."""
    rows = psql("""
        select c.relname || '|' || coalesce(f.relname, '')
        from pg_constraint k
        join pg_class c on c.oid = k.conrelid
        join pg_namespace n on n.oid = c.relnamespace
        left join pg_class f on f.oid = k.confrelid
        where k.contype = 'f' and n.nspname = 'public'
    """)

    edges = {}
    for line in rows.splitlines():
        child, parent = line.split("|")
        if parent and parent != child:
            edges.setdefault(child, set()).add(parent)

    done, out = set(), []
    remaining = list(names)
    while remaining:
        progressed = False
        for name in list(remaining):
            short = name.split(".")[-1]
            if edges.get(short, set()) <= {n.split(".")[-1] for n in done}:
                out.append(name)
                done.add(name)
                remaining.remove(name)
                progressed = True
        if not progressed:
            # A cycle. Nothing here has one, and if one appears it must be seen
            # rather than worked around by inserting in an arbitrary order.
            raise SystemExit(f"halqa bor: {remaining}")
    return out


def main():
    cols = columns()

    files = {}
    for path in sorted(DATA.glob("*.json")):
        name = path.stem
        qualified = name if "." in name else f"public.{name}"
        files[qualified] = path

    total = 0
    for qualified in order(files):
        rows = json.loads(files[qualified].read_text())
        if not rows:
            print(f"{qualified:28s} 0")
            continue

        have = cols.get(qualified)
        if have is None:
            raise SystemExit(f"{qualified}: bunday jadval yo'q")

        shared = [c for c in rows[0] if c in have]
        dropped = [c for c in rows[0] if c not in have]
        names = ", ".join(f'"{c}"' for c in shared)

        # Dollar quoting is literal — nothing inside it is escaped, so the
        # JSON must go in exactly as written. Escaping the backslashes here
        # instead turned every \uXXXX that json.dumps had produced into a
        # literal backslash-u, and every Russian menu name arrived as mojibake
        # that still counted as a row. ensure_ascii=False keeps the text as
        # text so there are no escapes to mangle in the first place.
        payload = json.dumps(rows, ensure_ascii=False)
        assert TAG not in payload, f"{qualified}: ma'lumot ichida {TAG} bor"

        sql = (
            f"insert into {qualified} ({names})\n"
            f"select {names} from json_populate_recordset(null::{qualified}, {TAG}{payload}{TAG}::json)\n"
            f"on conflict do nothing;"
        )
        psql(sql)

        got = psql(f"select count(*) from {qualified}").strip()
        note = f"  (tashlab ketildi: {', '.join(dropped)})" if dropped else ""
        print(f"{qualified:28s} {got} / {len(rows)}{note}")
        total += len(rows)

    # Rows arrived with their own ids, so every sequence behind one is still at
    # zero. Left alone, the next row written by the application collides with a
    # row that came from the export — which would look like a bug in the
    # application rather than in this script.
    moved = psql("""
        select setval(
                 pg_get_serial_sequence(c.table_schema || '.' || c.table_name, c.column_name),
                 greatest(1, (xpath('/row/max/text()',
                   query_to_xml(format('select max(%I) as max from %I.%I', c.column_name,
                                        c.table_schema, c.table_name),
                                false, true, '')))[1]::text::bigint),
                 true)
        from information_schema.columns c
        where c.table_schema in ('public','auth')
          and pg_get_serial_sequence(c.table_schema || '.' || c.table_name, c.column_name) is not null
    """)
    print(f"\n{len(moved.split())} ta ketma-ketlik oldinga surildi")

    print(f"jami {total} qator")


main()
