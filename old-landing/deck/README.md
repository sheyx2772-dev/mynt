# Pitch deck

`flex-pitch-uz.pptx` and `flex-pitch-en.pptx`, with a `.pdf` of each for
sending. Fifteen slides, 16:9.

## How it is made

The first version was built shape by shape in python-pptx and it looked like
what it was: text in boxes, screenshots of the website, no product in sight.
The photography in `public/mahsulot/` — the card, the ring, the bracelet, the
cafe, the hotel — was sitting there unused.

So the slides are designed in CSS instead, where the brand already lives:

```
python3 scripts/deck_html.py uz     # content-uz.json -> slides-uz.html
node scripts/deck-render.mjs uz     # -> deck/render-uz/*.png at 3840 wide
python3 scripts/deck_pack.py uz     # -> the pptx and the pdf
```

Changing the words means changing `deck/content-uz.json` or `content-en.json`
and running those three. Nothing in the deck is typed twice.

## What that trades away

Each slide in the finished file is one image, so the text is not editable in
PowerPoint. That is deliberate. The deck is presented, not edited, and in
exchange it looks identical on every machine: no missing font, no version of
PowerPoint disagreeing about a rounded corner, nothing reflowing on a projector
in a hall.

Icons are copied into `deck/icons/` rather than read from `node_modules` — an
unrelated `npm install --no-save` pruned the package once and the build stopped.

## Before presenting

Everything in it is true today. The prices are the constants the checkout uses,
the screenshots are of the live site, and the status slide says the domain and
Payme certification are still ahead rather than implying they are done. If that
changes, change the slide.
