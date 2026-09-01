"""Cut the generated renders down to the slots the site actually uses.

Sources are the raw generator output (see dizayn/rasm-promptlari.md); pass the
directory holding them as the first argument. Two families come out:

  * a cinematic office frame for the hero, where the card should look like an
    object in a room, and
  * three cut-outs on the generator's near-white ground for the device grids,
    where a busy background competes with the product.

The generator renders the accent as emerald (~150 deg); the brand lime is ~80.
Only that hue band is moved, so the warm marble and wood in the office frames
(~29 deg) come through untouched — a global rotation would turn them magenta.
"""

import os
import sys
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "mahsulot")

LO, HI = 95, 180
HUE_LUT = [
    round((62 + (i * 360 / 255 - LO) * 0.31 if LO <= i * 360 / 255 <= HI else i * 360 / 255) * 255 / 360)
    for i in range(256)
]


def limeify(im):
    h, s, v = im.convert("HSV").split()
    return Image.merge("HSV", (h.point(HUE_LUT), s, v)).convert("RGB")


def centred_box(w, h, fx, fy, ratio):
    """Largest ratio-shaped box inside w x h, centred on (fx, fy) fractions."""
    bw, bh = (w, w / ratio) if w / ratio <= h else (h * ratio, h)
    bw, bh = int(bw), int(bh)
    x = max(0, min(w - bw, int(w * fx - bw / 2)))
    y = max(0, min(h - bh, int(h * fy - bh / 2)))
    return (x, y, x + bw, y + bh)


def save(im, name, width):
    if im.width != width:
        im = im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)
    path = os.path.join(OUT, f"{name}.jpg")
    im.save(path, quality=90, optimize=True, progressive=True)
    print(f"{name:12s} {im.size[0]}x{im.size[1]}  {os.path.getsize(path) // 1024} KB")


# Scene frames: crop by focal point, since the object floats in a wider room.
# The hero carries all three form factors rather than the card alone — the
# headline is about choosing what to carry the number in, so a lone card
# argued against the sentence next to it.
SCENES = [
    ("trio-studio.jpeg", "hero", 16 / 9, (0.50, 0.50), 1600),
]

# The three-up sheet: fixed boxes, each kept inside its own panel so no gutter
# rule or neighbouring product creeps into the frame.
SHEET = "trio-plain.jpeg"
SHEET_BOXES = {
    "karta": (0, 91, 505, 596),
    "uzuk": (583, 106, 957, 480),
    "braslet": (522, 515, 1014, 1007),
}

os.makedirs(OUT, exist_ok=True)

for src, name, ratio, focal, width in SCENES:
    im = limeify(Image.open(os.path.join(SRC, src)))
    save(im.crop(centred_box(*im.size, *focal, ratio)), name, width)

sheet = limeify(Image.open(os.path.join(SRC, SHEET)))
for name, box in SHEET_BOXES.items():
    save(sheet.crop(box), name, 900)
