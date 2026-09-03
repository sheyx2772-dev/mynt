#!/usr/bin/env python3
"""Writes the pitch deck as HTML, one section per slide.

The first version of this deck was built shape by shape in python-pptx and it
looked like what it was: text in boxes. No photography, no icons, no weight —
a website tour rather than a pitch.

Slides are designed here instead, in the language the brand is already designed
in. That buys the real typefaces, the product photography, rounded corners,
gradients and a proper icon set, and it is the same CSS vocabulary the product
uses, so the deck and the thing it is selling look related.

The cost is that the text in the finished PPTX is a picture rather than an
editable box. It is a deliberate trade: this deck is presented, not edited, and
a change to the words is a change here followed by one command.

Usage: python3 scripts/deck_html.py [uz|en]  > deck/slides-<lang>.html
"""

import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "public" / "mahsulot"
CARDS = ROOT / "public" / "kartalar"
# Copied into the repo rather than read from node_modules: an unrelated
# `npm install --no-save` pruned the icon package once and the deck stopped
# building, which is a silly thing to depend on for fifteen small files.
ICONS = ROOT / "deck" / "icons"


def data_uri(path: Path) -> str:
    """Everything inlined: the renderer must not depend on a server."""
    kind = "image/jpeg" if path.suffix in (".jpg", ".jpeg") else "image/png"
    return f"data:{kind};base64,{base64.b64encode(path.read_bytes()).decode()}"


def icon(name: str, color: str = "#ABFF09", size: int = 44, stroke: float = 1.6) -> str:
    svg = (ICONS / f"{name}.svg").read_text()
    svg = svg.replace('stroke="currentColor"', f'stroke="{color}"')
    svg = svg.replace('width="24"', f'width="{size}"').replace('height="24"', f'height="{size}"')
    svg = svg.replace('stroke-width="2"', f'stroke-width="{stroke}"')
    return svg


PHOTO = {p.stem: data_uri(p) for p in PHOTOS.glob("*.jpg")}
CARD = {p.stem: data_uri(p) for p in CARDS.glob("*.jpg")}


CSS = """
:root {
  --ink: #0E0A1B;
  --ink-2: #16111F;
  --lime: #ABFF09;
  --lime-ink: #4D7C0F;
  --paper: #FAFAF8;
  --dim: #9C97A8;
  --dim-2: #6B6678;
}
* { margin: 0; padding: 0; box-sizing: border-box; }

.slide {
  width: 1280px; height: 720px;
  position: relative; overflow: hidden;
  background: var(--ink); color: #fff;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  display: flex; flex-direction: column;
}
.slide.light { background: var(--paper); color: var(--ink); }

.pad { padding: 56px 72px; }
.grow { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
.grow > * { width: 100%; }

.eyebrow {
  display: flex; align-items: center; gap: 14px;
  font-size: 13px; font-weight: 700; letter-spacing: .16em;
  text-transform: uppercase; color: var(--dim);
}
.light .eyebrow { color: var(--dim-2); }
.eyebrow::before { content: ''; width: 34px; height: 3px; background: var(--lime); border-radius: 2px; }

h1 { font-size: 78px; line-height: .96; letter-spacing: -.035em; font-weight: 700; }
h2 { font-size: 46px; line-height: 1.04; letter-spacing: -.028em; font-weight: 700; margin-top: 18px; }
h3 { font-size: 25px; line-height: 1.15; letter-spacing: -.02em; font-weight: 700; }
p  { font-size: 17px; line-height: 1.55; color: var(--dim); font-family: 'Inter', sans-serif; }
.light p { color: var(--dim-2); }
.lead { font-size: 21px; line-height: 1.5; }

.lime { color: var(--lime); }
.limeink { color: var(--lime-ink); }
.mark { background: var(--lime); color: var(--ink); padding: 0 .12em; border-radius: 6px; }

.cols { display: grid; gap: 26px; }
.c2 { grid-template-columns: 1fr 1fr; }
.c3 { grid-template-columns: repeat(3, 1fr); }
.c4 { grid-template-columns: repeat(4, 1fr); }

.card {
  background: var(--ink-2); border-radius: 22px; padding: 30px;
  display: flex; flex-direction: column; gap: 14px;
}
.light .card { background: #fff; border: 1px solid #E8E6EC; }
.card.lime { background: var(--lime); color: var(--ink); }
.card.lime p, .card.lime h3 { color: var(--ink); }

.shot { border-radius: 20px; overflow: hidden; background: #000; }
.shot img { width: 100%; height: 100%; object-fit: cover; display: block; }

.bleed { position: absolute; inset: 0; }
.bleed img { width: 100%; height: 100%; object-fit: cover; }
.scrim { position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(14,10,27,.95) 0%, rgba(14,10,27,.82) 38%, rgba(14,10,27,.18) 72%, rgba(14,10,27,.05) 100%); }
.scrim.up { background: linear-gradient(0deg, rgba(14,10,27,.96) 8%, rgba(14,10,27,.55) 48%, rgba(14,10,27,.12) 100%); }

.stat { font-size: 54px; font-weight: 700; letter-spacing: -.03em; line-height: 1; }
.stat.s { font-size: 40px; }
.tiny { font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: var(--dim); font-family: 'Inter', sans-serif; }
.light .tiny { color: var(--dim-2); }

.step { display: flex; gap: 18px; align-items: flex-start; }
.num {
  flex: none; width: 34px; height: 34px; border-radius: 11px;
  background: var(--lime); color: var(--ink);
  display: grid; place-items: center; font-weight: 700; font-size: 16px;
}
.rule { height: 1px; background: rgba(255,255,255,.1); }
.light .rule { background: #E8E6EC; }

.foot { display: flex; justify-content: space-between; font-size: 12px; color: var(--dim); }
.light .foot { color: var(--dim-2); }
.pill { display: inline-flex; align-items: center; gap: 9px; padding: 9px 16px;
  border: 1px solid rgba(255,255,255,.16); border-radius: 999px; font-size: 14px; }
.light .pill { border-color: #DCD9E2; }
"""


def slide(body, light=False, cls=""):
    return f'<section class="slide {"light" if light else ""} {cls}">{body}</section>'


def head(eyebrow_text, title, light=False):
    return f'''<div class="pad" style="padding-bottom:0">
      <div class="eyebrow">{eyebrow_text}</div>
      <h2>{title.replace(chr(10), "<br>")}</h2>
    </div>'''


def foot(page, light=False):
    return f'<div class="pad foot" style="padding-top:0"><span>flex.com.uz</span><span>{page}</span></div>'


def build(t):
    s = []

    # 1 — the product, full bleed. The photograph is the argument.
    s.append(slide(f'''
      <div class="bleed"><img src="{PHOTO['hero']}"></div>
      <div class="scrim"></div>
      <div class="pad grow" style="position:relative;display:flex;flex-direction:column;justify-content:center">
        <div class="eyebrow">{t['event']}</div>
        <h1 style="margin-top:26px">flex</h1>
        <h2 class="lime" style="max-width:640px">{t['tagline']}</h2>
        <p class="lead" style="max-width:520px;margin-top:22px">{t['sub']}</p>
      </div>'''))

    # 2 — problem
    cards = "".join(f'''<div class="card">
        {icon(ic, "#ABFF09", 40)}
        <h3>{h}</h3><p>{b}</p></div>''' for ic, h, b in t["problems"])
    s.append(slide(head(t["nav_problem"], t["problem_title"]) +
                   f'<div class="pad grow" style="padding-top:34px"><div class="cols c3">{cards}</div></div>' +
                   foot(1)))

    # 3 — solution, against the tap photograph
    steps = "".join(f'<div class="step"><div class="num">{i+1}</div><div><h3 style="font-size:20px">{h}</h3><p style="margin-top:6px">{b}</p></div></div>'
                    for i, (h, b) in enumerate(t["solution"]))
    s.append(slide(f'''
      <div class="bleed"><img src="{PHOTO['tegizish']}"></div>
      <div class="scrim"></div>
      <div class="pad grow" style="position:relative">
        <div class="eyebrow">{t['nav_solution']}</div>
        <h2 style="max-width:560px">{t['solution_title']}</h2>
        <div style="display:flex;flex-direction:column;gap:22px;margin-top:34px;max-width:520px">{steps}</div>
      </div>''' + foot(2)))

    # 4 — the devices, which is the thing people can hold
    devices = "".join(f'''<div class="card" style="padding:0;overflow:hidden">
        <div class="shot" style="height:262px;border-radius:22px 22px 0 0"><img src="{PHOTO[k]}"></div>
        <div style="padding:20px 24px 26px">
          <h3 style="font-size:21px">{n}</h3>
          <p style="margin-top:5px;font-size:15px">{d}</p>
          <div class="lime" style="margin-top:12px;font-weight:700;font-size:17px">{p}</div>
        </div></div>''' for k, n, d, p in t["devices"])
    s.append(slide(head(t["nav_devices"], t["devices_title"]) +
                   f'<div class="pad grow" style="padding-top:30px"><div class="cols c4">{devices}</div></div>' +
                   foot(3), light=False))

    # 5 — one number, many designs
    designs = "".join(f'<div class="shot" style="height:186px"><img src="{CARD[k]}"></div>' for k in t["card_designs"])
    s.append(slide(head(t["nav_design"], t["design_title"], True) +
                   f'''<div class="pad grow" style="padding-top:26px">
                     <p class="lead" style="max-width:760px">{t['design_body']}</p>
                     <div class="cols c4" style="margin-top:28px">{designs}</div>
                   </div>''' + foot(4, True), light=True))

    # 6 — the market, in photographs
    verts = "".join(f'''<div style="position:relative;border-radius:22px;overflow:hidden;height:340px">
        <img src="{PHOTO[k]}" style="width:100%;height:100%;object-fit:cover">
        <div class="scrim up"></div>
        <div style="position:absolute;left:26px;right:26px;bottom:24px">
          {icon(ic, "#ABFF09", 30)}
          <h3 style="margin-top:10px;font-size:22px">{n}</h3>
          <p style="margin-top:4px;font-size:15px">{d}</p>
        </div></div>''' for k, ic, n, d in t["verticals"])
    s.append(slide(head(t["nav_market"], t["market_title"]) +
                   f'<div class="pad grow" style="padding-top:28px"><div class="cols c3">{verts}</div></div>' +
                   foot(5)))

    # 7 — the loop, with the real screens
    loop = "".join(f'<div class="step"><div class="num">{i+1}</div><p style="color:#fff;font-size:17px;padding-top:5px">{x}</p></div>'
                   for i, x in enumerate(t["loop"]))
    s.append(slide(f'''
      <div class="pad" style="padding-bottom:0">
        <div class="eyebrow">{t['nav_loop']}</div><h2>{t['loop_title']}</h2>
      </div>
      <div class="pad grow" style="padding-top:26px;display:grid;grid-template-columns:250px 250px 1fr;gap:34px;align-items:start">
        <div class="shot" style="height:434px"><img src="{PHOTO['kafe']}" style="object-position:center"></div>
        <img src="{data_uri(ROOT / 'deck' / 'frames' / 'counter.png')}" style="width:100%;filter:drop-shadow(0 30px 60px rgba(0,0,0,.5))">
        <div style="display:flex;flex-direction:column;gap:19px">{loop}</div>
      </div>''' + foot(6)))

    # 8 — what a venue receives
    s.append(slide(head(t["nav_gets"], t["gets_title"], True) +
                   f'''<div class="pad grow" style="padding-top:26px;display:grid;grid-template-columns:1.25fr .75fr;gap:34px">
                     <div>
                       <div class="shot" style="height:340px;background:#fff"><img src="{data_uri(ROOT / 'deck' / 'shots' / 'cards.png')}" style="object-fit:cover;object-position:top"></div>
                       <p style="margin-top:18px">{t['gets_body']}</p>
                     </div>
                     <div style="display:flex;flex-direction:column;gap:14px">
                       {''.join(f'<div class="card" style="padding:20px 22px;gap:9px;flex-direction:row;align-items:center">{icon(ic,"#4D7C0F",26)}<span style="font-size:16px;font-weight:600">{x}</span></div>' for ic, x in t["gets_items"])}
                     </div>
                   </div>''' + foot(7, True), light=True))

    # 9 — model
    rows = "".join(f'''<div style="display:flex;justify-content:space-between;align-items:center;padding:19px 0">
        <div><h3 style="font-size:20px">{a}</h3><p style="margin-top:3px;font-size:15px">{c}</p></div>
        <div class="lime" style="font-size:24px;font-weight:700;white-space:nowrap">{b}</div>
      </div><div class="rule"></div>''' for a, b, c in t["bands"])
    s.append(slide(head(t["nav_model"], t["model_title"]) +
                   f'''<div class="pad grow" style="padding-top:22px;display:grid;grid-template-columns:1.5fr .8fr;gap:44px">
                     <div>{rows}</div>
                     <div class="card" style="justify-content:center">
                       {icon('file-text', '#ABFF09', 34)}
                       <h3 style="font-size:19px">{t['model_side_head']}</h3>
                       <p style="font-size:15px">{t['model_side']}</p>
                     </div>
                   </div>''' + foot(8)))

    # 10 — arithmetic
    cells = "".join(f'''<div class="card" style="gap:8px">
        <div class="tiny">{a}</div>
        <div class="stat">{b}</div>
        <p style="font-size:15px">{c}</p></div>''' for a, b, c in t["scenarios"])
    s.append(slide(head(t["nav_math"], t["math_title"], True) +
                   f'''<div class="pad grow" style="padding-top:30px">
                     <div class="cols c3">{cells}</div>
                     <p style="margin-top:26px;max-width:900px;font-size:15px">{t['math_note']}</p>
                   </div>''' + foot(9, True), light=True))

    # 11 — why now
    why = "".join(f'<div class="card">{icon(ic,"#ABFF09",36)}<h3 style="font-size:21px">{h}</h3><p style="font-size:15px">{b}</p></div>'
                  for ic, h, b in t["why"])
    s.append(slide(head(t["nav_why"], t["why_title"]) +
                   f'<div class="pad grow" style="padding-top:32px"><div class="cols c3">{why}</div></div>' + foot(10)))

    # 12 — status
    live = "".join(f'<div style="display:flex;gap:13px;align-items:flex-start;padding:9px 0"><span style="color:#4D7C0F;font-weight:700;font-size:17px">·</span><span style="font-size:16px">{x}</span></div>'
                   for x in t["status_live"])
    s.append(slide(head(t["nav_status"], t["status_title"], True) +
                   f'''<div class="pad grow" style="padding-top:22px;display:grid;grid-template-columns:1.15fr .85fr;gap:40px">
                     <div>{live}</div>
                     <div class="card lime" style="justify-content:center">
                       {icon('smartphone', '#0E0A1B', 34)}
                       <h3 style="font-size:21px">{t['status_next_head']}</h3>
                       <p style="font-size:16px">{t['status_next']}</p>
                     </div>
                   </div>''' + foot(11, True), light=True))

    # 13 — competition
    comp = "".join(f'''<div style="display:grid;grid-template-columns:200px 1fr 1fr;gap:26px;padding:20px 0;align-items:start">
        <h3 style="font-size:19px">{a}</h3><p style="font-size:15px">{b}</p>
        <p class="lime" style="font-size:15px">{c}</p></div><div class="rule"></div>''' for a, b, c in t["competitors"])
    s.append(slide(head(t["nav_comp"], t["comp_title"]) +
                   f'<div class="pad grow" style="padding-top:20px">{comp}</div>' + foot(12)))

    # 14 — team
    team = "".join(f'''<div class="card" style="align-items:flex-start">
        <div style="width:54px;height:54px;border-radius:16px;background:var(--lime);color:var(--ink);display:grid;place-items:center;font-weight:700;font-size:20px">{i}</div>
        <h3 style="font-size:20px">{n}</h3>
        <p class="limeink" style="font-weight:700;font-size:15px;margin-top:-6px">{r}</p>
        <p style="font-size:15px">{w}</p></div>''' for i, n, r, w in t["team"])
    s.append(slide(head(t["nav_team"], t["team_title"], True) +
                   f'<div class="pad grow" style="padding-top:34px"><div class="cols c3">{team}</div></div>' +
                   foot(13, True), light=True))

    # 15 — ask, over the family photograph
    use = "".join(f'<div style="display:flex;gap:18px;align-items:baseline"><span class="lime" style="font-weight:700;font-size:19px;width:56px">{a}</span><span style="font-size:16px">{b}</span></div>'
                  for a, b in t["use"])
    s.append(slide(f'''
      <div class="bleed"><img src="{PHOTO['oila']}"></div>
      <div class="scrim"></div>
      <div class="pad grow" style="position:relative;display:grid;grid-template-columns:1.1fr .9fr;gap:40px">
        <div>
          <div class="eyebrow">{t['nav_ask']}</div>
          <div class="stat" style="font-size:64px;margin-top:20px" class="lime"><span class="lime">{t['ask_amount']}</span></div>
          <p style="margin-top:10px">{t['ask_stage']}</p>
          <div style="display:flex;flex-direction:column;gap:15px;margin-top:30px">{use}</div>
        </div>
        <div class="card" style="justify-content:center;background:rgba(22,17,31,.9)">
          <h3 style="font-size:20px">{t['contact_head']}</h3>
          <p style="font-size:17px;line-height:2;color:#fff">{t['contact']}</p>
        </div>
      </div>''' + foot(14)))

    return s


def page(sections):
    return f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{''.join(sections)}</body></html>"""


if __name__ == "__main__":
    lang = sys.argv[1] if len(sys.argv) > 1 else "uz"
    content = json.loads((ROOT / "deck" / f"content-{lang}.json").read_text())
    out = ROOT / "deck" / f"slides-{lang}.html"
    out.write_text(page(build(content)))
    print(f"  {out.relative_to(ROOT)}  {len(build(content))} slides")
