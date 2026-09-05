"""Compare every field of every moved row against what Supabase returned.

Counting rows only proves nothing was lost. This proves nothing was changed:
each row is read back as JSON and compared field by field against the export,
with the two normalisations a round trip through Postgres legitimately makes —
a timestamp written `+00:00` comes back `+00:00` from a different formatter,
and a number stored as numeric comes back as a string.
"""
import json, pathlib, subprocess, sys
from datetime import datetime

S = pathlib.Path(__file__).parent
DB = sys.argv[1]


def psql(sql):
    out = subprocess.run(
        ["docker", "compose", "exec", "-T", "db", "psql", "-U", "flex", "-d", DB, "-qtA", "-c", sql],
        capture_output=True, text=True, cwd="/home/zoyirjon/private/flex/backend")
    if out.returncode:
        raise SystemExit(out.stderr[:400])
    return out.stdout


def norm(v):
    if v is None:
        return None
    if isinstance(v, str):
        # Timestamps: compare the instant, not how it was printed.
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00")).timestamp()
        except ValueError:
            pass
        # A numeric column comes back as a string either way; make "1" and 1 equal.
        try:
            return float(v)
        except ValueError:
            return v
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, list):
        return [norm(x) for x in v]
    if isinstance(v, dict):
        return {k: norm(x) for k, x in sorted(v.items())}
    return v


problems, checked = [], 0
for path in sorted((S / "sbdata").glob("*.json")):
    name = path.stem if "." in path.stem else f"public.{path.stem}"
    want = json.loads(path.read_text())
    if not want:
        continue

    got = json.loads(psql(f"select coalesce(json_agg(t), '[]'::json) from {name} t") or "[]")

    # Keyed on the whole row where there is no single id, so order does not
    # matter and a duplicate would not hide a missing one.
    def key(row):
        for k in ("id", "normalized", "token_hash"):
            if k in row and row[k] is not None:
                return str(row[k])
        return json.dumps({k: norm(v) for k, v in sorted(row.items())}, default=str)

    got_by = {key(r): r for r in got}
    for row in want:
        k = key(row)
        mine = got_by.get(k)
        if mine is None:
            problems.append(f"{name}: {k} yo'q")
            continue
        for field, value in row.items():
            if field not in mine:
                continue  # a column our schema does not have; already reported
            if norm(value) != norm(mine[field]):
                problems.append(f"{name} {k}.{field}: {value!r} -> {mine[field]!r}")
            checked += 1

print(f"{checked} ta maydon solishtirildi")
if problems:
    print(f"\n{len(problems)} ta farq:")
    for p in problems[:25]:
        print(" ", p)
    sys.exit(1)
print("farq yo'q — ko'chirilgan ma'lumot manbaga aynan mos")
