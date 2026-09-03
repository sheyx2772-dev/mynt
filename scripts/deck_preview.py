#!/usr/bin/env python3
"""Renders a pptx to PNGs so the deck can be looked at before it is sent.

There is no PowerPoint, Keynote or LibreOffice on this machine, and a deck
nobody has seen is a deck nobody can vouch for. This draws the same geometry the
file contains — same positions, same sizes, same colours — and, importantly,
wraps text the way PowerPoint will, because the failure this is meant to catch
is a paragraph growing into the one underneath it.

It is a proof sheet, not a renderer: shadows, rounded corners and kerning are
not reproduced. Layout and overflow are.

Usage: python3 scripts/deck_preview.py deck/flex-pitch-en.pptx [out-dir]
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.util import Emu

SCALE = 110  # pixels per inch
REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def px(value):
    return int(Emu(value).inches * SCALE)


def font_for(size_pt, bold):
    return ImageFont.truetype(BOLD if bold else REGULAR, max(6, int(size_pt * SCALE / 72)))


def wrap(draw, words, fnt, max_width):
    """Greedy wrap, which is what a text box does with word_wrap on."""
    lines, line = [], ""
    for word in words.split(" "):
        trial = f"{line} {word}".strip()
        if line and draw.textlength(trial, font=fnt) > max_width:
            lines.append(line)
            line = word
        else:
            line = trial
    if line:
        lines.append(line)
    return lines or [""]


def render(path, out_dir):
    prs = Presentation(path)
    width, height = px(prs.slide_width), px(prs.slide_height)
    out_dir.mkdir(parents=True, exist_ok=True)

    for index, slide in enumerate(prs.slides, 1):
        img = Image.new("RGB", (width, height), "white")
        draw = ImageDraw.Draw(img)

        for shape in slide.shapes:
            x, y, w, h = px(shape.left), px(shape.top), px(shape.width), px(shape.height)

            if shape.shape_type == 13:
                import io

                pic = Image.open(io.BytesIO(shape.image.blob)).convert("RGBA")
                pic = pic.resize((max(1, w), max(1, h)))
                img.paste(pic, (x, y), pic)
                continue

            if not shape.has_text_frame or not shape.text_frame.text.strip():
                try:
                    draw.rectangle([x, y, x + w, y + h], fill="#" + str(shape.fill.fore_color.rgb))
                except Exception:
                    pass
                continue

            cursor = y
            for para in shape.text_frame.paragraphs:
                for run in para.runs:
                    size = run.font.size.pt if run.font.size else 14
                    fnt = font_for(size, bool(run.font.bold))
                    try:
                        colour = "#" + str(run.font.color.rgb)
                    except Exception:
                        colour = "black"

                    step = int(size * SCALE / 72 * (para.line_spacing or 1.0) * 1.2)
                    for line in wrap(draw, run.text, fnt, w):
                        anchor_x = x
                        if str(para.alignment) == "RIGHT (3)":
                            anchor_x = x + w - draw.textlength(line, font=fnt)
                        draw.text((anchor_x, cursor), line, font=fnt, fill=colour)
                        cursor += step

            # A red rule where the text ran past the box it was given: the one
            # failure this sheet exists to show.
            if cursor > y + h + 4:
                draw.line([(x, cursor), (x + w, cursor)], fill="#FF0033", width=3)

        img.save(out_dir / f"{index:02d}.png")

    print(f"  {len(prs.slides._sldIdLst)} slides → {out_dir}")


if __name__ == "__main__":
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "deck/flex-pitch-en.pptx")
    destination = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/preview")
    render(source, destination)
