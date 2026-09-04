"""Work the made-to-order design queue.

    python3 scripts/designs.py list
    python3 scripts/designs.py fill <request-id> <image-file>
    python3 scripts/designs.py refuse <request-id> "sabab"

`list` prints each waiting request with the prompt already assembled, ready to
paste into a generator. `fill` takes what comes back, crops it to a card, moves
the accent onto the brand lime and files it under public/kartalar/shaxsiy — a
design made for one buyer, which outranks whatever catalogue design they had
chosen.

The artwork lands in the repository rather than in object storage on purpose,
for now: at a few requests a day the deploy that publishes it is also the
moment somebody looks at it before a buyer does. That stops being sensible at
volume, and the row already carries a URL, so moving to R2 later changes this
script and nothing else.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "kartalar", "shaxsiy")
CARD_RATIO = 1.586


def env(name):
    path = os.path.join(ROOT, ".env.local")
    for line in open(path):
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(f"{name} .env.local da topilmadi")


def api(path, method="GET", body=None, prefer=None):
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    url = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/") + "/rest/v1/" + path
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
        raise SystemExit(f"baza xatosi {e.code}: {e.read().decode()[:300]}")


def cmd_list():
    rows = api("design_requests?status=eq.pending&select=id,handle,wish,prompt,created_at&order=created_at")
    if not rows:
        print("navbat bo'sh")
        return
    for r in rows:
        print("=" * 72)
        print(f"{r['handle']}   {r['created_at'][:16].replace('T', ' ')}")
        print(f"so'ragani: {r['wish']}")
        print(f"id: {r['id']}")
        print("-" * 72)
        print(r["prompt"])
        print()
    print(f"{len(rows)} ta so'rov kutyapti")


def limeify_and_crop(src, dest):
    """Same treatment every catalogue design gets — see scripts/prep-shots.py."""
    from PIL import Image

    LO, HI, BRAND = 95, 180, 82
    im = Image.open(src).convert("RGB")

    small = im.convert("HSV").resize((352, 192))
    hues = sorted(
        p[0] * 360 // 255
        for p in small.getdata()
        if p[1] > 60 and p[2] > 60 and LO <= p[0] * 360 // 255 <= HI
    )
    if len(hues) >= 40:
        delta = BRAND - hues[len(hues) // 2]
        lut = []
        for i in range(256):
            d = i * 360 / 255
            if LO <= d <= HI:
                d = max(0, min(359, d + delta))
            lut.append(round(d * 255 / 360))
        h, s, v = im.convert("HSV").split()
        im = Image.merge("HSV", (h.point(lut), s, v)).convert("RGB")

    w, h = im.size
    bw, bh = (w, w / CARD_RATIO) if w / CARD_RATIO <= h else (h * CARD_RATIO, h)
    bw, bh = int(bw), int(bh)
    x, y = (w - bw) // 2, (h - bh) // 2
    im = im.crop((x, y, x + bw, y + bh)).resize((1200, round(1200 / CARD_RATIO)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im.save(dest, quality=90, optimize=True, progressive=True)
    return im.size


def cmd_fill(request_id, image_path):
    if not os.path.exists(image_path):
        raise SystemExit(f"fayl yo'q: {image_path}")

    rows = api(f"design_requests?id=eq.{request_id}&select=id,handle,status")
    if not rows:
        raise SystemExit("bunday so'rov yo'q")
    req = rows[0]
    if req["status"] != "pending":
        raise SystemExit(f"bu so'rov allaqachon '{req['status']}'")

    handle = req["handle"]
    name = re.sub(r"[^A-Z0-9]", "", handle.upper())
    dest = os.path.join(OUT_DIR, f"{name}.jpg")
    size = limeify_and_crop(image_path, dest)
    url = f"/kartalar/shaxsiy/{name}.jpg"

    api(
        f"design_requests?id=eq.{request_id}",
        method="PATCH",
        body={"status": "filled", "image_url": url, "filled_at": "now()"},
        prefer="return=minimal",
    )
    api(
        f"handles?normalized=eq.{handle}",
        method="PATCH",
        body={"custom_design_url": url},
        prefer="return=minimal",
    )
    print(f"{handle}: {dest} ({size[0]}x{size[1]})")
    print("git add public/kartalar/shaxsiy && git commit && git push — shundan keyin ko'rinadi")


def cmd_refuse(request_id, note):
    api(
        f"design_requests?id=eq.{request_id}",
        method="PATCH",
        body={"status": "refused", "note": note},
        prefer="return=minimal",
    )
    print("rad etildi, sabab foydalanuvchiga ko'rinadi")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["list"]:
        cmd_list()
    elif args[:1] == ["fill"] and len(args) == 3:
        cmd_fill(args[1], args[2])
    elif args[:1] == ["refuse"] and len(args) == 3:
        cmd_refuse(args[1], args[2])
    else:
        print(__doc__)
        raise SystemExit(1)
