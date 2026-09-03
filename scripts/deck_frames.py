#!/usr/bin/env python3
"""Puts the product screenshots into phone frames for the pitch deck.

A screenshot floating on a slide reads as a picture of a website. The same
screenshot inside a device reads as something somebody is holding, which is the
claim being made — this runs on the phone already in the guest's hand.

Writes to deck/frames/. Run before scripts/deck_build.py.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "deck" / "shots"
OUT = ROOT / "deck" / "frames"

INK = (14, 10, 27, 255)
LIME = (171, 255, 9, 255)


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([(0, 0), (size[0] - 1, size[1] - 1)], radius, fill=255)
    return mask


def phone(name, crop_bottom=None):
    """One screenshot in a black phone body, on transparency."""
    shot = Image.open(SHOTS / f"{name}.png").convert("RGBA")

    # Screens are 2532 tall and a slide is not. Take the top, which is where the
    # thing being shown always is.
    if crop_bottom:
        shot = shot.crop((0, 0, shot.width, min(crop_bottom, shot.height)))

    bezel = 34
    radius = 132

    screen = shot.copy()
    screen.putalpha(rounded_mask(screen.size, radius - bezel // 2))

    body = Image.new("RGBA", (screen.width + bezel * 2, screen.height + bezel * 2), (0, 0, 0, 0))
    shell = Image.new("RGBA", body.size, INK)
    shell.putalpha(rounded_mask(body.size, radius))
    body.alpha_composite(shell)
    body.alpha_composite(screen, (bezel, bezel))

    # The notch, drawn rather than imaged — the same one the app draws.
    draw = ImageDraw.Draw(body)
    notch_w, notch_h = int(body.width * 0.30), 46
    x = (body.width - notch_w) // 2
    draw.rounded_rectangle([(x, bezel + 18), (x + notch_w, bezel + 18 + notch_h)], 23, fill=INK)

    OUT.mkdir(parents=True, exist_ok=True)
    body.save(OUT / f"{name}.png")
    print(f"  {name:<10} {body.width}×{body.height}")


def plain(name, radius=48):
    """A wide screenshot with its corners softened, no device around it."""
    img = Image.open(SHOTS / f"{name}.png").convert("RGBA")
    img.putalpha(rounded_mask(img.size, radius))
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f"{name}.png")
    print(f"  {name:<10} {img.width}×{img.height}")


if __name__ == "__main__":
    # Cropped to what matters on each: the menu down to its call bar, the
    # counter down to its last waiting request.
    phone("menu", crop_bottom=2100)
    phone("counter", crop_bottom=1500)
    phone("cabinet", crop_bottom=1900)
    phone("report", crop_bottom=1700)
    phone("profile", crop_bottom=1900)
    plain("cards")
    print(f"\nWritten to {OUT}\n")
