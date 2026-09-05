"""Read everything out of Supabase, one JSON file per table.

Through the REST interface with the service role key, because there is no
direct Postgres connection to that project — the key is only ever sent to
Supabase itself. `auth.users` is not in the REST schema, so it comes from the
auth admin API, the same door the old operator scripts used.

Paged rather than fetched whole: PostgREST caps a response, and a table that
grew past the cap would silently arrive short. The page size is asked for
explicitly and the loop stops when a page comes back smaller than it.
"""
import json
import os
import pathlib
import subprocess
import sys
import urllib.error
import urllib.request

S = pathlib.Path(__file__).parent
OUT = S / "sbdata"
PAGE = 1000

URL = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
if not URL or not KEY:
    raise SystemExit(
        "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY muhitda bo'lsin.\n"
        "Kalit faqat Supabase'ning o'ziga yuboriladi va hech qayerga yozilmaydi."
    )

HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

# Both lists below are read out of our own migrated database rather than kept
# as files beside this script. A hand-maintained list of tables is a list that
# goes stale the first time somebody adds one, and the table it forgets is the
# one nobody notices is empty.
def psql(sql, database="flex"):
    out = subprocess.run(
        ["docker", "compose", "exec", "-T", "db", "psql", "-U", "flex",
         "-d", database, "-v", "ON_ERROR_STOP=1", "-qtA"],
        input=sql, capture_output=True, text=True,
        cwd=str(pathlib.Path(__file__).resolve().parents[2]),
    )
    if out.returncode:
        raise SystemExit(f"psql: {out.stderr.strip()[:400]}")
    return out.stdout



def get(path, extra=None):
    req = urllib.request.Request(URL + path, headers={**HEADERS, **(extra or {})})
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode())


def table(name):
    rows, start = [], 0
    while True:
        try:
            page = get(f"/rest/v1/{name}?select=*&limit={PAGE}&offset={start}")
        except urllib.error.HTTPError as e:
            body = e.read().decode()[:300]
            # Only a table that is genuinely absent is skipped. Anything else
            # stops the run: an export that quietly leaves a table out is the
            # one failure this whole exercise cannot afford.
            if e.code in (404, 400) and ("PGRST205" in body or "42P01" in body):
                return None
            raise SystemExit(f"{name}: {e.code} {body}")
        rows.extend(page)
        if len(page) < PAGE:
            return rows
        start += PAGE


def accounts():
    users, page = [], 1
    while True:
        got = get(f"/auth/v1/admin/users?per_page=200&page={page}").get("users", [])
        users.extend(got)
        if len(got) < 200:
            break
        page += 1

    # Only the columns our own `auth.users` has. Supabase's table carries forty,
    # and copying the ones we do not read would be copying somebody else's
    # schema rather than our data — including hashed passwords for a login
    # method this product no longer has.
    return [
        {"id": u["id"], "email": u.get("email"), "created_at": u["created_at"]}
        for u in users
    ]


def main():
    OUT.mkdir(exist_ok=True)
    names = psql("""
        select table_name from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
          and table_name <> 'goose_db_version'
        order by table_name
    """).split()

    report = []
    accs = accounts()
    (OUT / "auth.users.json").write_text(json.dumps(accs, indent=1))
    report.append(("auth.users", len(accs)))

    for name in names:
        rows = table(name)
        if rows is None:
            report.append((name, "yo'q"))
            continue
        (OUT / f"{name}.json").write_text(json.dumps(rows, indent=1))
        report.append((name, len(rows)))

    for name, n in report:
        print(f"{name:24s} {n}")


main()
