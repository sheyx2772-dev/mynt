#!/usr/bin/env python3
"""Cuts usable product frames out of the supplier material.

Two of the photographs we have for the pet tag and the object tag arrived as
somebody else's marketing layout — a Russian marketplace listing, four scenes
laid out under a headline, with the vendor's badge over each picture and their
wordmark moulded into the tag itself. The scenes are the only part worth having.

This lifts each scene clear of the layout: below the category chip, inside the
badge, and with the vendor's wordmark on the key tag painted out from the tag's
own surface. What comes out is a photograph of a small black tag on a collar and
on a keyring, which is what the slide needs and all it claims.

Run before scripts/deck_grade.py.
"""

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "mahsulot"

SOURCE = Path.home() / "Desktop" / "flex-rasm" / "image-1788424472660.webp"

# Boxes in the source layout, taken below each category chip and stopping short
# of the badge in the corner.
SCENES = {
    "hayvon-teg": (60, 548, 604, 1024),
    "buyum-teg": (776, 1283, 1317, 1701),
}

# The vendor's wordmark, moulded into the tag in the second scene. Given in
# fractions of the cropped frame so it survives a change of crop.
WORDMARK = ("buyum-teg", 0.878, 0.550, 0.958, 0.610)


def paint_out(img, box):
    """Cover a mark with the surface it sits on, taken from just below it."""
    x0, y0, x1, y1 = box
    h = y1 - y0
    patch = img.crop((x0, y1 + 2, x1, y1 + 2 + h)).filter(ImageFilter.GaussianBlur(1.2))
    img.paste(patch, (x0, y0))
    # Soften the seam so the repair does not read as a rectangle.
    edge = img.crop((x0 - 4, y0 - 4, x1 + 4, y1 + 4)).filter(ImageFilter.GaussianBlur(1.6))
    img.paste(edge, (x0 - 4, y0 - 4))
    return img


if __name__ == "__main__":
    source = Image.open(SOURCE).convert("RGB")
    for name, box in SCENES.items():
        img = source.crop(box)
        if WORDMARK[0] == name:
            w, h = img.size
            img = paint_out(img, tuple(
                int(v * (w if i % 2 == 0 else h)) for i, v in enumerate(WORDMARK[1:])
            ))
        img.save(OUT / f"{name}.jpg", quality=95)
        print(f"  {name}.jpg  {img.size[0]}x{img.size[1]}")
