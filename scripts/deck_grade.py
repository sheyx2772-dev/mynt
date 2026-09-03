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
ROOMS = {"kafe", "mehmonxona", "salon", "biznes", "oila", "avto"}
TARGET_MEAN = 92.0
MATCH = 0.75


def match_exposure(img: Image.Image) -> Image.Image:
    """Gamma, not a multiply: a multiply blows the highlights it reaches."""
    mean = sum(ImageStat.Stat(img).mean) / 3.0
    if mean <= 1 or mean >= 254:
        return img

    gamma = math.log(TARGET_MEAN / 255.0) / math.log(mean / 255.0)
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


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for folder in SOURCES:
        for path in sorted(folder.glob("*.jpg")):
            img = grade(path)
            if path.stem in ROOMS:
                img = match_exposure(img)
            img.save(OUT / path.name, quality=92)
            print(f"  {path.name:<18} {sum(ImageStat.Stat(img).mean) / 3:5.1f}")
    print(f"\nWritten to {OUT}\n")
