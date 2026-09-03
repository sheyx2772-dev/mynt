# Pitch deck

Two files, one layout: `flex-pitch-en.pptx` and `flex-pitch-uz.pptx`.
Thirteen slides, 16:9, editable in PowerPoint, Keynote or Google Slides.

## Rebuilding it

```
node scripts/deck-shots.mjs https://flex-five-kohl.vercel.app
python3 scripts/deck_frames.py
python3 scripts/deck_build.py
```

The first takes the screenshots from the running site, the second puts them in
phone frames, the third writes both decks. Editing the text means editing the
`EN` and `UZ` dictionaries at the bottom of `deck_build.py` — one layout, two
dictionaries, so the Uzbek one cannot quietly drift away from the English.

`python3 scripts/deck_preview.py deck/flex-pitch-en.pptx` renders a proof sheet
to `/tmp/preview`. It wraps text the way PowerPoint does and draws a red rule
under any paragraph that outgrew its box, which is the mistake this deck made
four times before it was looked at.

## Two things to check before presenting

**Arial, on purpose.** The brand faces are Space Grotesk and Inter, and neither
is on a stranger's laptop. A font that is missing is silently replaced by one
that ruins the layout, so the deck uses a font that is everywhere and lets size,
space and the lime carry it instead.

**Everything here is true today.** The prices are the constants the checkout
uses. The screenshots are of the live site, not mock-ups. The status slide lists
what runs and says the domain and Payme certification are still ahead. If any of
that changes, change the slide — a deck that overstates is found out in the
meeting after it.
