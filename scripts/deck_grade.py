#!/usr/bin/env python3
"""Grades the photography to one palette.

The photographs were shot separately and it showed. The cafe and the hotel come
back warm gold at a quarter saturation, the salon is warm pink, the suzani card
is blue-violet, and the product shots are near-white studio cutouts — while the
brand is a cold violet-black with an acid lime. Put side by side on a slide,
nothing looked like it belonged to the same company.

This is the ordinary fix a designer would apply and nothing cleverer: pull the
saturation down so no photograph shouts, cool the shadows toward the brand's
ink, and leave the highlights alone so faces and metal keep their life. It does
not make the pictures identical — it makes them agree.

Writes deck/graded/. Run before scripts/deck_html.py.
"""

import math
from pathlib import Path

from PIL import Image, ImageEnhance, ImageStat

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [ROOT / "public" / "mahsulot", ROOT / "public" / "kartalar"]
OUT = ROOT / "deck" / "graded"

# The ink the whole deck sits on. Shadows are pulled toward it so a warm room
# photographed under tungsten stops fighting the slide behind it.
INK = (14, 10, 27)

# How far. Enough to unify, not so far that the cafe stops looking warm and
# inviting — which is the thing the photograph is there to sell.
SATURATION = 0.72
SHADOW_PULL = 0.30
LIFT = 6

# The rooms that appear side by side in one row, and so have to look like one
# afternoon rather than six. Grading fixed their colour and left their exposure
# alone: the salon came back at mean 146 next to the cafe at 55, which is what
# "the pictures do not go together" actually was. Every one of them is pulled
# most of the way to a shared brightness with a gamma curve — partly, so the
# cafe stays the dim evening room it was photographed as.
#
# The product cutouts and the two hero frames are deliberately not in this list.
# A watch on white is supposed to be bright.
# What each photograph should come back at, on a 0-255 mean. The rooms share a
# number because they appear side by side in one row and have to look like one
# afternoon rather than six; the studio frames get their own, lower one — they
# are meant to be dark, they were merely too dark to see the product in.
#
# Anything absent from this table is left alone. A watch on white is supposed
# to be bright.
EXPOSURE = {
    "kafe": 92.0, "mehmonxona": 92.0, "salon": 92.0,
    "biznes": 92.0, "oila": 92.0, "avto": 92.0,
    "qurilmalar": 68.0, "hero": 62.0,
    "avtostiker": 86.0, "avtobus": 92.0, "stend": 92.0,
    "tolov": 100.0, "klinika": 92.0, "kafe-stend": 92.0, "skan": 92.0,
    "menyu-stend": 96.0, "mehmonxona2": 92.0, "salon2": 96.0, "klinika2": 96.0,
    "restoran": 88.0, "konsyerj": 92.0, "menyu-telefon": 92.0, "stend2": 96.0,
    "haqiqiy-kafe": 104.0, "stiker": 86.0,
}
MATCH = 0.75


def match_exposure(img: Image.Image, target: float) -> Image.Image:
    """Gamma, not a multiply: a multiply blows the highlights it reaches."""
    mean = sum(ImageStat.Stat(img).mean) / 3.0
    if mean <= 1 or mean >= 254:
        return img

    gamma = math.log(target / 255.0) / math.log(mean / 255.0)
    gamma = 1.0 + (gamma - 1.0) * MATCH
    table = [min(255, round(255 * (i / 255.0) ** gamma)) for i in range(256)]
    return img.point(table * 3)


def grade(path: Path) -> Image.Image:
    img = ImageEnhance.Color(Image.open(path).convert("RGB")).enhance(SATURATION)
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            # Darker pixels move further: a shadow becomes the brand's violet
            # while a highlight stays where the photographer put it.
            weight = (1.0 - (r + g + b) / 765.0) * SHADOW_PULL
            pixels[x, y] = (
                min(255, int(r + (INK[0] - r) * weight) + LIFT),
                min(255, int(g + (INK[1] - g) * weight) + LIFT),
                min(255, int(b + (INK[2] - b) * weight) + LIFT),
            )

    return img


# The title slide carries the words on its left and the objects on its right, and
# in the frame as shot the card sits a third of the way in — squarely under the
# type. Widening the canvas to the left and extending the studio floor into it
# slides all three objects clear of the words. The added strip is a stretch of
# the frame's own leftmost column, which is empty dark backdrop, so there is
# nothing in it to notice.
SHIFT = {}

# The three studio cutouts are square frames with the object small in the middle
# and a great deal of white around it. Dropped into the wide thumbnail band on
# the devices slide, cover() kept the white and cropped the product in half.
# These are trimmed to what is actually in them and re-centred on a 3:2 white
# card, so the band shows the whole object at the size it deserves.
TRIM = {"karta", "uzuk", "braslet"}
TRIM_RATIO = 2.0
TRIM_MARGIN = 0.07


def trim_to_object(img: Image.Image) -> Image.Image:
    grey = img.convert("L")
    # Anything below this is the product or its shadow; above it is backdrop.
    box = grey.point(lambda v: 255 if v < 242 else 0).getbbox()
    if box is None:
        return img

    img = img.crop(box)
    w, h = img.size
    pad = int(max(w, h) * TRIM_MARGIN)
    cw, ch = w + pad * 2, h + pad * 2
    if cw / ch < TRIM_RATIO:
        cw = int(ch * TRIM_RATIO)
    else:
        ch = int(cw / TRIM_RATIO)

    canvas = Image.new("RGB", (cw, ch), (255, 255, 255))
    canvas.paste(img, ((cw - w) // 2, (ch - h) // 2))
    return canvas


def shift_right(img: Image.Image, amount: float) -> Image.Image:
    w, h = img.size
    pad = int(w * amount)
    out = Image.new("RGB", (w + pad, h))
    out.paste(img.crop((0, 0, 2, h)).resize((pad, h), Image.LANCZOS), (0, 0))
    out.paste(img, (pad, 0))
    return out


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for folder in SOURCES:
        for path in sorted(folder.glob("*.jpg")):
            img = grade(path)
            if path.stem in EXPOSURE:
                img = match_exposure(img, EXPOSURE[path.stem])
            if path.stem in TRIM:
                img = trim_to_object(img)
            if path.stem in SHIFT:
                img = shift_right(img, SHIFT[path.stem])
            img.save(OUT / path.name, quality=92)
            print(f"  {path.name:<18} {sum(ImageStat.Stat(img).mean) / 3:5.1f}")
    print(f"\nWritten to {OUT}\n")
