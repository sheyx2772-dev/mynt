from PIL import Image
import os

SRC = "/private/tmp/claude-501/-Users-macbookpro-Desktop-mynt-uz/dfb142f6-8615-4cd4-8811-f555f69cfc63/scratchpad"
OUT = "/Users/macbookpro/Desktop/mynt.uz/public/mahsulot"

# The generator rendered the accent as emerald (~153 deg); the brand lime is
# ~80 deg. Only hues inside the green band are moved, so the warm marble and
# wood in the same frames (~29 deg) are left exactly as they were.
LO, HI = 95, 180
def lut():
    t = []
    for i in range(256):
        d = i * 360 / 255
        if LO <= d <= HI:
            d = 62 + (d - LO) * 0.31
        t.append(round(d * 255 / 360))
    return t
HUE_LUT = lut()

def limeify(im):
    h, s, v = im.convert("HSV").split()
    return Image.merge("HSV", (h.point(HUE_LUT), s, v)).convert("RGB")

def box(w, h, cx, cy, ratio):
    """Largest ratio-shaped box inside w x h, centred on (cx, cy)."""
    bw, bh = (w, w / ratio) if w / ratio <= h else (h * ratio, h)
    bw, bh = int(bw), int(bh)
    x = max(0, min(w - bw, int(cx - bw / 2)))
    y = max(0, min(h - bh, int(cy - bh / 2)))
    return (x, y, x + bw, y + bh)

JOBS = [
    # source, output, aspect, focal point as a fraction of the frame
    ("g2.jpeg",  "karta.jpg",   16 / 10, (0.49, 0.55)),
    ("g7.jpeg",  "uzuk.jpg",    1.0,     (0.49, 0.48)),
    ("g3.jpeg",  "braslet.jpg", 1.0,     (0.50, 0.58)),
    ("g10.jpeg", "oila.jpg",    16 / 9,  (0.50, 0.58)),
]

os.makedirs(OUT, exist_ok=True)
for src, dst, ratio, (fx, fy) in JOBS:
    im = Image.open(os.path.join(SRC, src))
    im = limeify(im)
    w, h = im.size
    im = im.crop(box(w, h, w * fx, h * fy, ratio))
    if im.width > 1600:
        im = im.resize((1600, round(1600 * im.height / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, dst), quality=88, optimize=True, progressive=True)
    print(f"{dst:14s} {im.size[0]}x{im.size[1]}  <- {src}")
