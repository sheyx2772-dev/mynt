"""Draws the header and footer artboards for the Flex canvas.

Every colour, radius and size here is lifted from the product's own tokens
(`landing/src/app/globals.css`) and from the header that ships today
(`old-landing/src/app/page.tsx`, `src/components/Mark.tsx`). Nothing is
rounded to a grid and nothing is invented.

Re-run this file to change a variant, then re-seed the canvas from its output.
"""

import pathlib

OUT = pathlib.Path(__file__).parent

# --- tokens ---------------------------------------------------------------
LIME, LIME_INK = "#abff09", "#6b9e00"
INK, PAPER, WHITE = "#0e0a1b", "#fafaf8", "#ffffff"
INK2, MUTE, INK3 = "#4a465a", "#5c586a", "#736f82"
L_SOFT, LINE, L2, L_LEAD = "#f0eef5", "#e6e4ec", "#cfccd8", "#b5afc6"
INK_S1, INK_S2, INK_LINE = "#16122a", "#1f1a36", "#2b2644"
PAPER2, PAPER3 = "#b3afc2", "#7f7b92"
GOLD = "#c9a961"
SHADOW_SLAB = "0 1px 0 rgb(14 10 27 / 0.3), 0 8px 20px -8px rgb(14 10 27 / 0.45)"

NAV = ["Narxlar", "Shaxsiy", "Biznes", "Rezidentlar", "Kabinet"]

# The mark, at the geometry both renderers share (MARK in Mark.tsx).
_GLYPH = (
    '<svg viewBox="0 0 100 100" width="{s}" height="{s}" fill="none" style="display:block">'
    '<circle cx="27" cy="50" r="10" fill="{c}"></circle>'
    '<path d="M 43.57 29.96 A 26 26 0 0 1 43.57 70.04" stroke="{c}" stroke-width="11" stroke-linecap="round"></path>'
    '<path d="M 55.67 15.32 A 45 45 0 0 1 55.67 84.68" stroke="{c}" stroke-width="11" stroke-linecap="round"></path>'
    "</svg>"
)

HEAD = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap">
  <style>
    body { margin: 0; font-family: Inter, system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
    a { color: inherit; text-decoration: none; }
    a:hover { color: inherit; }
    .num { font-family: "JetBrains Mono", ui-monospace, monospace; letter-spacing: 0.14em; }
    .cap { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; }
  </style>
</helmet>
"""
FOOT = "</x-dc>\n</body>\n</html>\n"


def write(name: str, body: str) -> None:
    (OUT / name).write_text(HEAD + body + FOOT)


# --- pieces ---------------------------------------------------------------
def logo(tone="dark", size=28):
    """`tone` is the tile the glyph sits on, not the glyph."""
    glyph = _GLYPH.format(s=int(size * 0.7), c=LIME)
    if tone == "dark":
        tile = (
            f"display:flex;align-items:center;justify-content:center;width:{size}px;"
            f"height:{size}px;border-radius:8px;border:1px solid {INK_LINE};background:{INK_S1}"
        )
        word = WHITE
    else:
        tile = (
            f"display:flex;align-items:center;justify-content:center;width:{size}px;"
            f"height:{size}px;border-radius:8px;background:{INK}"
        )
        word = INK
    return (
        '<div style="display:flex;align-items:center;gap:8px">'
        f'<span style="{tile}">{glyph}</span>'
        f'<span style="font-size:20px;font-weight:600;letter-spacing:-0.02em;color:{word}">flex</span>'
        "</div>"
    )


def nav(tone="dark", gap=32, size=14):
    colour = PAPER2 if tone == "dark" else INK2
    links = "".join(
        f'<a href="#" style="color:{colour};font-size:{size}px;font-weight:500">{i}</a>'
        for i in NAV
    )
    return f'<nav style="display:flex;gap:{gap}px;align-items:center">{links}</nav>'


def lang(active="uz", tone="dark"):
    on_bg = INK_LINE if tone == "dark" else "#f1f0f4"
    on_fg = WHITE if tone == "dark" else INK
    off = PAPER3 if tone == "dark" else INK3
    cells = ""
    for code in ("uz", "ru", "en"):
        if code == active:
            cells += (
                f'<span style="padding:4px 8px;border-radius:6px;background:{on_bg};'
                f'color:{on_fg};font-size:12px;font-weight:600">{code}</span>'
            )
        else:
            cells += f'<span style="padding:4px 8px;color:{off};font-size:12px;font-weight:500">{code}</span>'
    return f'<div style="display:flex;align-items:center;gap:2px">{cells}</div>'


def cta(text="Raqam olish"):
    return (
        '<a href="#" style="display:inline-flex;align-items:center;height:40px;padding:0 18px;'
        f"border-radius:12px;background:{LIME};color:{INK};font-size:14px;font-weight:600;"
        f'box-shadow:{SHADOW_SLAB}">{text}</a>'
    )


def quiet(text, tone="dark"):
    colour = PAPER2 if tone == "dark" else INK2
    return (
        '<a href="#" style="display:inline-flex;align-items:center;height:40px;padding:0 14px;'
        f'color:{colour};font-size:14px;font-weight:500">{text}</a>'
    )


def account(tone="dark"):
    """Signed in: the number is the identity, so the number is what is shown."""
    ring = INK_LINE if tone == "dark" else LINE
    text = PAPER2 if tone == "dark" else INK2
    return (
        '<div style="display:flex;align-items:center;gap:10px;height:40px;padding:0 6px 0 0">'
        f'<div style="width:32px;height:32px;border-radius:9999px;border:1px solid {ring};'
        f"background:{GOLD};display:flex;align-items:center;justify-content:center;"
        f'font-size:12px;font-weight:600;color:{INK}">AZ</div>'
        f'<span class="num" style="font-size:12px;font-weight:600;color:{text}">AAA777</span>'
        "</div>"
    )


def burger(tone="dark"):
    colour = WHITE if tone == "dark" else INK
    bars = "".join(
        f'<span style="display:block;width:18px;height:1.5px;background:{colour};border-radius:1px"></span>'
        for _ in range(3)
    )
    return (
        '<button style="display:flex;flex-direction:column;gap:4px;align-items:center;'
        "justify-content:center;width:40px;height:40px;border-radius:12px;background:transparent;"
        f'border:1px solid {INK_LINE if tone == "dark" else LINE};cursor:pointer">{bars}</button>'
    )


def caption(title, note):
    return (
        '<div style="padding:22px 40px 14px">'
        f'<div class="cap" style="color:{INK3}">{title}</div>'
        f'<div style="margin-top:6px;font-size:13px;line-height:1.5;color:{MUTE};max-width:900px">{note}</div>'
        "</div>"
    )


def state_tag(text):
    return (
        f'<div style="padding:0 40px 8px"><span class="cap" style="color:{L_LEAD}">{text}</span></div>'
    )


def page(bg, inner):
    return f'<div style="background:{bg};min-height:100%">{inner}</div>'


# --- headers --------------------------------------------------------------
def header_bar(tone, right, sticky_note=True):
    """One row: the mark, the sections, and what to do next."""
    ground = f"{INK}" if tone == "dark" else WHITE
    border = INK_LINE if tone == "dark" else LINE
    return (
        f'<header style="background:{ground};border-bottom:1px solid {border}">'
        '<div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;'
        'justify-content:space-between;gap:32px;padding:16px 24px">'
        f"{logo(tone)}"
        f"{nav(tone)}"
        f'<div style="display:flex;align-items:center;gap:12px">{right}</div>'
        "</div></header>"
    )


def build_header_dark():
    out = caption(
        "A — bitta qator, ink yuzada",
        "Bugungi header. Qora yuza saytning yuqori qismini bir butun qiladi va lime undan "
        "kuchli chiqadi. Kamchiligi: qora tasma har sahifada takrorlanadi va sahifa oq bo'lsa, "
        "kontrast keskin.",
    )
    signed_out = state_tag("Kirmagan") + header_bar(
        "dark", quiet("Kirish", "dark") + cta()
    )
    signed_in = state_tag("Kirgan") + header_bar("dark", account("dark") + cta())
    write("Main.dc.html", page(PAPER, out + signed_out + '<div style="height:28px"></div>' + signed_in + '<div style="height:32px"></div>'))


def build_header_paper():
    out = caption(
        "B — bitta qator, paper yuzada",
        "Xuddi shu tuzilma, oq varaq ustida. Sahifaning qolgani bilan bir butun bo'ladi va "
        "lime yagona kuchli element bo'lib qoladi. Kamchiligi: header sahifadan ajralmaydi, "
        "skroll paytida chegara yo'qoladi.",
    )
    signed_out = state_tag("Kirmagan") + header_bar(
        "light", quiet("Kirish", "light") + cta()
    )
    signed_in = state_tag("Kirgan") + header_bar("light", account("light") + cta())
    write("HeaderB.dc.html", page(PAPER, out + signed_out + '<div style="height:28px"></div>' + signed_in + '<div style="height:32px"></div>'))


def build_header_two_tier():
    top = (
        f'<div style="background:{INK_S1};border-bottom:1px solid {INK_LINE}">'
        '<div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;'
        'justify-content:space-between;padding:8px 24px">'
        f'<div style="display:flex;align-items:center;gap:20px">'
        f'<span class="num" style="font-size:12px;color:{PAPER2}">+998 97 724 79 99</span>'
        f'<span style="font-size:12px;color:{PAPER3}">Toshkent · MC LEGAL AB</span>'
        "</div>"
        f'<div style="display:flex;align-items:center;gap:12px">{lang("uz","dark")}'
        f'<span style="width:1px;height:14px;background:{INK_LINE}"></span>'
        f'<a href="#" style="font-size:12px;font-weight:500;color:{PAPER2}">Kirish</a>'
        "</div></div></div>"
    )
    main = (
        f'<header style="background:{WHITE};border-bottom:1px solid {LINE}">'
        '<div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;'
        'justify-content:space-between;gap:32px;padding:18px 24px">'
        f"{logo('light', 30)}{nav('light')}"
        f'<div style="display:flex;align-items:center;gap:12px">{cta()}</div>'
        "</div></header>"
    )
    out = caption(
        "C — ikki qatlam",
        "Tepada ingichka qora qator: telefon, til, kirish. Pastda oq qatorda faqat bo'limlar "
        "va bitta lime tugma. Aloqa raqami har sahifada ko'rinadi — biznes mijoz uchun bu "
        "foydali. Kamchiligi: balandligi 100px dan oshadi, telefonda ekranning yaxshi qismini yeydi.",
    )
    write("HeaderC.dc.html", page(PAPER, out + top + main + '<div style="height:32px"></div>'))


def build_header_minimal():
    bar = (
        f'<header style="background:{WHITE};border-bottom:1px solid {LINE}">'
        '<div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;'
        'justify-content:space-between;padding:16px 24px">'
        f"{logo('light', 30)}"
        f'<div style="display:flex;align-items:center;gap:12px">{cta()}{burger("light")}</div>'
        "</div></header>"
    )
    sheet = (
        f'<div style="max-width:1152px;margin:0 auto;padding:16px 24px 0">'
        f'<div style="max-width:320px;margin-left:auto;background:{WHITE};border:1px solid {LINE};'
        f"border-radius:16px;padding:8px;box-shadow:0 1px 1px rgb(14 10 27 / 0.2), "
        '0 4px 10px -4px rgb(14 10 27 / 0.3)">'
        + "".join(
            f'<a href="#" style="display:block;padding:10px 12px;border-radius:8px;'
            f'font-size:15px;font-weight:500;color:{INK}">{i}</a>'
            for i in NAV
        )
        + f'<div style="height:1px;background:{L_SOFT};margin:8px 4px"></div>'
        + f'<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px">'
        + lang("uz", "light")
        + f'<a href="#" style="font-size:14px;font-weight:500;color:{INK2}">Kirish</a>'
        + "</div></div></div>"
    )
    out = caption(
        "D — minimal, menyu ochilgan",
        "Faqat logotip va lime tugma; bo'limlar gamburger ostida. Eng toza va eng tez "
        "o'qiladigan variant. Kamchiligi jiddiy: Narxlar va Biznes — sotuv sahifalari, va "
        "ular bir bosish ortiga yashirinadi.",
    )
    write("HeaderD.dc.html", page(PAPER, out + bar + sheet + '<div style="height:32px"></div>'))


def build_phone():
    top = (
        f'<div style="background:{INK};border-bottom:1px solid {INK_LINE};'
        'display:flex;align-items:center;justify-content:space-between;padding:12px 16px">'
        f"{logo('dark', 26)}"
        f'<div style="display:flex;align-items:center;gap:8px">'
        f'<a href="#" style="display:inline-flex;align-items:center;height:36px;padding:0 14px;'
        f'border-radius:12px;background:{LIME};color:{INK};font-size:13px;font-weight:600">Raqam olish</a>'
        f"{burger('dark')}</div></div>"
    )
    body = (
        f'<div style="padding:28px 20px;background:{PAPER};flex:1">'
        f'<div style="font-size:26px;font-weight:600;letter-spacing:-0.02em;color:{INK};line-height:1.2">'
        "Flex — raqamli<br>vizitkangiz</div>"
        f'<div style="margin-top:12px;font-size:15px;line-height:1.5;color:{MUTE}">'
        "Bir tegish bilan kontaktingiz saqlanadi. Ilova o'rnatish kerak emas.</div>"
        f'<div style="margin-top:20px;display:flex;align-items:center;gap:10px">'
        f'<span class="num" style="font-size:13px;font-weight:600;color:{INK};border:1px solid {LINE};'
        'border-radius:8px;padding:8px 12px">AAA777</span>'
        f'<span style="font-size:13px;color:{INK3}">120 000 000 so\'m</span></div>'
        "</div>"
    )
    tabs = ["Bosh sahifa", "Rezidentlar", "Postlar", "Kabinet"]
    icons = [
        '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
        '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M17 5.2a3.5 3.5 0 0 1 0 6.6"/><path d="M18.5 14.6A5 5 0 0 1 22 19.4"/>',
        '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.2"/>',
        '<circle cx="12" cy="8" r="4"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/>',
    ]
    cells = ""
    for i, (name, path) in enumerate(zip(tabs, icons)):
        active = i == 0
        colour = INK if active else INK3
        cells += (
            f'<a href="#" style="flex:1;display:flex;flex-direction:column;align-items:center;'
            f'gap:4px;padding:10px 0 8px;color:{colour};min-height:56px;justify-content:center">'
            f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{path}</svg>'
            f'<span style="font-size:10px;letter-spacing:0.06em">{name}</span></a>'
        )
    bottom = (
        f'<div style="background:{WHITE};border-top:1px solid {LINE};display:flex">{cells}</div>'
    )
    write(
        "HeaderPhone.dc.html",
        f'<div style="display:flex;flex-direction:column;height:844px;background:{PAPER}">'
        f"{top}{body}{bottom}</div>",
    )


# --- footers --------------------------------------------------------------
def footer_columns():
    cols = [
        ("Mahsulot", ["Shaxsiy", "Narxlar", "Qurilmalar", "Rezidentlar", "Postlar"]),
        ("Biznes", ["Kafe va restoran", "Mehmonxona", "Do'kon", "Jamoa uchun"]),
        ("Kompaniya", ["Aloqa", "Ommaviy oferta", "Foydalanish shartlari", "Maxfiylik"]),
    ]
    out = ""
    for title, items in cols:
        links = "".join(
            f'<a href="#" style="display:block;font-size:14px;color:{PAPER2};padding:5px 0">{i}</a>'
            for i in items
        )
        out += (
            "<div>"
            f'<div class="cap" style="color:{PAPER3};margin-bottom:10px">{title}</div>'
            f"{links}</div>"
        )
    return out


def legal_row():
    return (
        f'<div style="border-top:1px solid {INK_LINE};margin-top:36px;padding-top:20px;'
        'display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap">'
        f'<div style="font-size:13px;color:{PAPER3}">'
        '"MC LEGAL" AB · STIR <span class="num" style="font-size:12px">312559000</span> · '
        '<span class="num" style="font-size:12px">+998 97 724 79 99</span></div>'
        f"{lang('uz','dark')}</div>"
    )


def build_footer_columns():
    out = caption(
        "1 — uch ustun",
        "Mahsulot / Biznes / Kompaniya, pastda huquqiy qator. Sahifani cho'zmaydi va biznes "
        "bo'limiga yo'l ochiq qoladi. Kundalik ish uchun shu yetadi.",
    )
    body = (
        f'<footer style="background:{INK};padding:48px 24px 36px">'
        '<div style="max-width:1152px;margin:0 auto">'
        '<div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:40px">'
        f'<div>{logo("dark", 30)}'
        f'<div style="margin-top:14px;font-size:13px;line-height:1.6;color:{PAPER3};max-width:220px">'
        "Bir tegish bilan ulashiladigan raqamli vizitka.</div></div>"
        f"{footer_columns()}</div>{legal_row()}</div></footer>"
    )
    write("FooterA.dc.html", page(PAPER, out + body))


def build_footer_full():
    devices = [
        ("Karta", "200 000 so'm"),
        ("Uzuk", "350 000 so'm"),
        ("Braslet", "250 000 so'm"),
        ("Stiker", "[NARX]"),
    ]
    chips = "".join(
        f'<a href="#" style="display:flex;align-items:center;justify-content:space-between;gap:12px;'
        f"border:1px solid {INK_LINE};border-radius:12px;padding:10px 12px;background:{INK_S1}\">"
        f'<span style="font-size:13px;font-weight:500;color:{WHITE}">{name}</span>'
        f'<span class="num" style="font-size:11px;color:{PAPER3}">{price}</span></a>'
        for name, price in devices
    )
    socials = "".join(
        f'<a href="#" style="display:flex;align-items:center;justify-content:center;width:36px;'
        f'height:36px;border-radius:9999px;border:1px solid {INK_LINE};color:{PAPER2}">'
        f'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{path}</svg></a>'
        for path in (
            '<path d="M21.5 4.5 2.8 11.4l5.3 1.8 2 6.3 3-3.6 4.6 3.4z"/><path d="M8.1 13.2 18 6.6l-7.6 8.2"/>',
            '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.4" cy="6.6" r="1"/>',
            '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l1-4h-4V7.5A.5.5 0 0 1 12.5 7H15z"/>',
        )
    )
    out = caption(
        "2 — to'liq",
        "Ustunlar + sotiladigan buyumlar narxi bilan + ijtimoiy tarmoqlar + manzil. SEO uchun "
        "eng foydalisi va qurilmalarga to'g'ridan-to'g'ri yo'l ochadi. Kamchiligi: har sahifada "
        "uzun quyruq, telefonda skroll cho'ziladi.",
    )
    body = (
        f'<footer style="background:{INK};padding:48px 24px 36px">'
        '<div style="max-width:1152px;margin:0 auto">'
        '<div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:40px">'
        f'<div>{logo("dark", 30)}'
        f'<div style="margin-top:14px;font-size:13px;line-height:1.6;color:{PAPER3};max-width:220px">'
        "Bir tegish bilan ulashiladigan raqamli vizitka.</div>"
        f'<div style="margin-top:18px;display:flex;gap:8px">{socials}</div></div>'
        f"{footer_columns()}</div>"
        f'<div style="margin-top:36px;padding-top:28px;border-top:1px solid {INK_LINE}">'
        f'<div class="cap" style="color:{PAPER3};margin-bottom:12px">Qurilmalar</div>'
        '<div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:12px">'
        f"{chips}</div></div>"
        f'<div style="margin-top:28px;font-size:13px;line-height:1.6;color:{PAPER3}">'
        "Toshkent shahri, [KO'CHA VA UY RAQAMI]<br>Ish vaqti: [ISH VAQTI]</div>"
        f"{legal_row()}</div></footer>"
    )
    write("FooterB.dc.html", page(PAPER, out + body))


def build_footer_thin():
    out = caption(
        "3 — ingichka",
        "Bitta qator: huquqiy nom, shartlar, aloqa, til. Eng kam joy egallaydi. Kamchiligi: "
        "biznes va qurilmalar sahifalariga ichki havolalar yo'qoladi — ular sotuv sahifalari.",
    )
    body = (
        f'<footer style="background:{INK};padding:20px 24px">'
        '<div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;'
        'justify-content:space-between;gap:24px;flex-wrap:wrap">'
        f'<div style="display:flex;align-items:center;gap:20px">{logo("dark", 26)}'
        f'<span style="font-size:13px;color:{PAPER3}">© 2026 "MC LEGAL" AB</span></div>'
        f'<div style="display:flex;align-items:center;gap:20px">'
        f'<a href="#" style="font-size:13px;color:{PAPER2}">Shartlar</a>'
        f'<a href="#" style="font-size:13px;color:{PAPER2}">Oferta</a>'
        f'<a href="#" style="font-size:13px;color:{PAPER2}">Aloqa</a>'
        f'{lang("uz","dark")}</div></div></footer>'
    )
    write("FooterC.dc.html", page(PAPER, out + body + '<div style="height:24px"></div>'))


for build in (
    build_header_dark,
    build_header_paper,
    build_header_two_tier,
    build_header_minimal,
    build_phone,
    build_footer_columns,
    build_footer_full,
    build_footer_thin,
):
    build()

print("artboards:", ", ".join(sorted(p.name for p in OUT.glob("*.dc.html"))))
