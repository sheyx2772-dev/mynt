"""Assign a handle without a payment, and see what has been given away.

    python3 scripts/handles.py give AAA777 odam@example.com "sartarosh, Chilonzor"
    python3 scripts/handles.py given
    python3 scripts/handles.py free AAA777

`give` is for the launch samples: a handle handed to somebody chosen, with the
reason written down. It is deliberately a separate path from a sale — a gift
that looks like a sale in the numbers makes the first month's figures a lie,
and the first month's figures are the ones that decide what to do next.

The recipient must already have an account, because a handle belongs to a user
id. Ask them to sign in at flex.com.uz/kirish first; it takes them a minute and
costs nothing.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(name):
    for line in open(os.path.join(ROOT, ".env.local")):
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(f"{name} .env.local da topilmadi")


def api(path, method="GET", body=None, prefer=None):
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    url = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/") + "/" + path
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            text = res.read().decode()
            return json.loads(text) if text else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f"xato {e.code}: {e.read().decode()[:300]}")


def find_user(email):
    """Supabase keeps users out of the REST schema, so this goes via auth admin."""
    q = urllib.parse.quote(email)
    res = api(f"auth/v1/admin/users?filter={q}")
    users = res.get("users", []) if isinstance(res, dict) else []
    for u in users:
        if (u.get("email") or "").lower() == email.lower():
            return u["id"]
    return None


def cmd_give(handle, email, reason):
    handle = handle.upper()
    user_id = find_user(email)
    if not user_id:
        raise SystemExit(
            f"{email} hali ro'yxatdan o'tmagan.\n"
            "Avval flex.com.uz/kirish da hisob ochsin, keyin qayta urinib ko'ring."
        )

    rows = api(f"rest/v1/handles?normalized=eq.{handle}&select=normalized,status,user_id")
    if not rows:
        raise SystemExit(f"{handle} bazada yo'q")
    if rows[0]["status"] == "claimed" and rows[0]["user_id"]:
        raise SystemExit(f"{handle} allaqachon band")

    api(
        f"rest/v1/handles?normalized=eq.{handle}",
        method="PATCH",
        body={
            "status": "claimed",
            "user_id": user_id,
            "claimed_at": "now()",
            # No price paid. This is what keeps a gift out of the revenue
            # figures, and it is why the column is nullable.
            "price_paid": None,
            "gift_reason": reason,
        },
        prefer="return=minimal",
    )
    print(f"{handle} -> {email}")
    print(f"sabab: {reason}")


def cmd_given():
    rows = api(
        "rest/v1/handles?gift_reason=not.is.null"
        "&select=normalized,owner_name,gift_reason,claimed_at&order=claimed_at.desc"
    )
    if not rows:
        print("hali hech kimga berilmagan")
        return
    for r in rows:
        when = (r["claimed_at"] or "")[:10]
        who = r["owner_name"] or "—"
        print(f"{r['normalized']:8s} {when}  {who:20s} {r['gift_reason']}")
    print(f"\njami {len(rows)} ta berilgan")


def cmd_free(handle):
    handle = handle.upper()
    api(
        f"rest/v1/handles?normalized=eq.{handle}",
        method="PATCH",
        body={
            "status": "available",
            "user_id": None,
            "claimed_at": None,
            "gift_reason": None,
            "owner_name": None,
            "bio": None,
            "links": [],
        },
        prefer="return=minimal",
    )
    print(f"{handle} bo'shatildi")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["give"] and len(args) == 4:
        cmd_give(args[1], args[2], args[3])
    elif args[:1] == ["given"]:
        cmd_given()
    elif args[:1] == ["free"] and len(args) == 2:
        cmd_free(args[1])
    else:
        print(__doc__)
        raise SystemExit(1)
