#!/usr/bin/env python3
"""Writes the deck's copy into deck/content-{uz,en}.json.

The deck used to open on "paper is printed once", which is a true sentence about
a menu and says nothing about the eight other places the company sells into. The
problem slide is now the list of moments a person actually has the problem in —
a car with no number behind the glass, a dog with nothing on its collar, a bank
card read out loud across a counter — and every one of them is a product we
already ship.

Market figures are the state statistics committee's, dated, and shown with the
date on the slide. An investor in that hall can check them, and a number that
cannot be checked is worth less than no number.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

UZ = {
    # ── problem ────────────────────────────────────────────────────────────
    "nav_problem": "Muammo",
    "problem_title": "Ma'lumot hali ham qog'ozda\nva og'zaki uzatiladi.",
    "problems": [
        ["receipt", "Qog'oz rekvizit",
         "Kompaniya rekvizitlari qo'lda yozib beriladi. Bitta xato raqam — to'lov noto'g'ri hisobga tushadi."],
        ["car", "Parkovkada raqam yo'q",
         "Mashina yo'lni to'sib qo'ydi. Oyna ortida telefon raqami yo'q, bo'lsa ham qo'lda yozilgan qog'oz."],
        ["paw-print", "Hayvon yo'qoladi",
         "Bo'yinbog'da hech narsa yo'q. Topgan odam egasi bilan bog'lana olmaydi."],
        ["key-round", "Kalit va buyum yo'qoladi",
         "Sumka, kalit, chamadon — topilsa ham egasiga qaytmaydi."],
        ["credit-card", "Savdoda karta raqami",
         "To'lov uchun karta raqami og'zaki aytiladi yoki qog'ozga yoziladi. Xato ham, xavf ham shu yerda."],
        ["users", "Uchrashuvda almashish yo'q",
         "Vizitka tugaydi, telefon raqamini terish uzoq. Uchrashuvdan keyin hech kim hech kimni topolmaydi."],
        ["badge-check", "Brendni tanitish qiyin",
         "Kichik biznesning nomi mijoz telefonida qolmaydi. Har safar noldan tanishtirish kerak."],
        ["file-user", "Rezyume uzatish qiyin",
         "PDF yuboriladi, havola yo'qoladi, versiyalar chalkashadi. Ish beruvchi eng eskisini ochadi."],
    ],

    # ── solution map ───────────────────────────────────────────────────────
    "nav_answer": "Yechim",
    "answer_title": "Bitta raqam, bitta buyum,\nsakkizta holat.",
    "answer_body": "Har bir muammo bir xil tarzda hal bo'ladi: NFC buyumga tegiziladi yoki QR skanerlanadi — "
                   "va o'sha vaziyat uchun kerakli sahifa ochiladi. Ilova o'rnatilmaydi.",
    "answers": [
        ["Qog'oz rekvizit", "Rekvizitlar sahifada — nusxalash tugmasi bilan, xatosiz"],
        ["Parkovkada raqam yo'q", "Avtovizitka: tegizadi — sizga qo'ng'iroq yoki xabar ketadi"],
        ["Hayvon yo'qoladi", "Bo'yinbog' tegi: topgan odam egasining sahifasini ochadi"],
        ["Kalit va buyum", "Buyum tegi: topilma egasiga qaytadi"],
        ["Savdoda karta raqami", "To'lov sahifasi: Payme orqali, raqam aytilmaydi"],
        ["Uchrashuvda almashish", "Bir tegish — kontakt telefonga saqlanadi"],
        ["Brendni tanitish", "Sahifa sizning brendingizda, mijoz telefonida qoladi"],
        ["Rezyume uzatish", "Bitta havola, doim eng oxirgi versiya"],
    ],

    # ── why ours is not an ordinary NFC card ───────────────────────────────
    "nav_notplain": "Farqimiz",
    "notplain_title": "Bu oddiy NFC vizitka emas.",
    "notplain_body": "Bozorda NFC karta ko'p. Farq kartada emas — kartaning orqasida nima turganida.",
    "notplain": [
        ["sparkles", "Raqam sizniki", "AAA000 formatidagi noyob raqam. Past raqamli seriya takrorlanmaydi — uni boshqa hech kim bosib chiqara olmaydi."],
        ["route", "Sahifa o'zgaradi, qurilma yo'q", "Ish, raqam, kompaniya o'zgardi — sahifani tahrirlaysiz. Karta o'sha kartaligicha qoladi."],
        ["chart-column", "Statistika", "Necha marta ochildi, qaysi havola bosildi, qaysi kundan. Qog'oz vizitka buni hech qachon aytmaydi."],
        ["languages", "Uch til", "O'zbek, rus, ingliz. Mehmon o'z tilida ko'radi."],
        ["qr-code", "NFC va QR birga", "NFC yo'q telefon ham ochadi. Chop etilgan QR bilan ishlaydi."],
        ["credit-card", "Mahalliy to'lov", "Payme ulangan: obuna, hisob-faktura, muddat eslatmasi."],
        ["store", "Obyekt yarmi ham bor", "Menyu, stol belgilari, ofitsiant chaqiruvi, kassa ekrani — bir tizimda."],
        ["shield-check", "Ma'lumot sizniki", "Sahifani istalgan vaqtda o'chirasiz yoki boshqa qurilmaga ko'chirasiz."],
    ],

    # ── market size ────────────────────────────────────────────────────────
    "nav_size": "Bozor hajmi",
    "size_title": "Bozor hajmi — so'mda.",
    "size_rows": [
        ["TAM", "116 900 obyekt", "209 mlrd so'm / yil",
         "O'zbekistondagi barcha umumiy ovqatlanish, chakana savdo va joylashtirish obyektlari, eng past tarif bo'yicha"],
        ["SAM", "29 000 obyekt", "51,9 mlrd so'm / yil",
         "Toshkent va viloyat markazlari — bugun yetib boradigan qismimiz"],
        ["SOM", "1 000 obyekt", "1,79 mlrd so'm / yil",
         "Uch yillik maqsad. Bu jami bozorning 0,9 foizi"],
    ],
    "size_units": [
        ["utensils-crossed", "29 582", "umumiy ovqatlanish korxonasi · 01.08.2026"],
        ["store", "86 180", "chakana savdo korxonasi · 01.01.2026"],
        ["bed-double", "1 156", "mehmonxona va joylashtirish vositasi · 2021"],
        ["car", "4,98 mln", "jismoniy shaxslarga tegishli avtotransport · 01.07.2026"],
    ],
    "size_source": "Manba: O'zbekiston Respublikasi Statistika qo'mitasi (stat.uz). "
                   "Obuna hisobi eng past tarif — oyiga 149 000 so'm — bo'yicha olingan.",

    # ── competition ────────────────────────────────────────────────────────
    "nav_rivals": "Raqobat",
    "rivals_title": "Raqobatchilar tahlili.",
    "rivals_cols": ["Shaxsiy raqam", "Obyekt yarmi", "Mahalliy to'lov", "Statistika", "Uch til"],
    "rivals": [
        ["flex", ["Ha · AAA000", "Ha", "Ha · Payme", "Ha", "Ha"], True],
        ["UNQX", ["Ha · uch harf, uch raqam", "Yo'q", "Ma'lum emas", "Ma'lum emas", "Ma'lum emas"], False],
        ["Popl, V1CE, Linq", ["Ha · havola", "Yo'q", "Yo'q", "Ha", "Qisman"], False],
        ["QR-menyu servislari", ["Yo'q", "Faqat menyu", "Qisman", "Qisman", "Ha"], False],
        ["Qog'oz vizitka", ["Yo'q", "Yo'q", "Yo'q", "Yo'q", "Yo'q"], False],
    ],
    "rivals_note": "UNQX — Farg'ona vodiysida, shaxsiy profil bilan. Obyekt yarmini mahalliy hech kim sotmaydi: "
                   "menyu, stol so'rovlari, kassa ekrani va oylik hisobot bitta tizimda.",

    # ── traction ───────────────────────────────────────────────────────────
    "nav_traction": "Biz kimmiz",
    "traction_title": "Bu birinchi urinish emas.",
    "traction": [
        ["award", "IT Park rezidenti", "Rasmiy status, soliq va eksport rejimi bilan."],
        ["rocket", "Akseleratsiyalar", "Bir necha akseleratsiya dasturidan o'tganmiz."],
        ["users", "Mashhur shaxslar", "NFC rekvizitlarimiz taniqli shaxslarda ishlatilgan."],
        ["car", "Avtomobillarga", "Avtovizitka seriyasi ishlab chiqarilgan va sotilgan."],
        ["building-2", "B2B sotuvlar", "Kafe, do'kon, kiyim do'koni va shifoxonalarga NFC qurilma, sayt va ilova sotganmiz."],
        ["truck", "Yetkazib beruvchilar", "Qurilma ishlab chiqaruvchi firmalar bilan to'g'ridan-to'g'ri ishlaymiz."],
    ],

    # ── roadmap ────────────────────────────────────────────────────────────
    "nav_road": "Reja",
    "road_title": "Keyingi o'n sakkiz oy.",
    "road": [
        ["2026 · IV chorak", "Ishga tushirish", [
            "flex.com.uz domeni va Payme sertifikatsiyasi",
            "Birinchi 100 obyekt: kafe, salon, klinika",
            "Avtovizitka va buyum tegi seriyasi savdoda",
        ]],
        ["2027 · I chorak", "Mahsulotni kengaytirish", [
            "Mobil ilova — sherik jamoa bilan",
            "Hayvon tegi va rezyume sahifasi",
            "Hisob-faktura va oylik hisobot avtomatik",
        ]],
        ["2027 · II chorak", "Sotuvni ko'paytirish", [
            "500 obyekt",
            "Viloyat markazlarida diler tarmog'i",
            "Yetkazib beruvchilar bilan hajmli shartnoma",
        ]],
        ["2027 · III–IV chorak", "Chegaradan tashqari", [
            "1 000 obyekt — SOM maqsadi",
            "Qozog'iston va Qirg'iziston bo'yicha sinov",
            "Seed bosqichiga chiqish",
        ]],
    ],
    "road_note": "Sanalar investitsiya olingandan keyingi jadval bo'yicha.",
}

EN = {
    "nav_problem": "The problem",
    "problem_title": "Information still travels\non paper and out loud.",
    "problems": [
        ["receipt", "Paper details",
         "Company bank details are written out by hand. One wrong digit and the payment lands in the wrong account."],
        ["car", "No number in the windscreen",
         "A car is blocking the way. There is no number behind the glass, or there is one, on a scrap of paper."],
        ["paw-print", "A pet goes missing",
         "Nothing on the collar. Whoever finds the animal has no way to reach its owner."],
        ["key-round", "Keys and things go missing",
         "A bag, a key, a suitcase — found, and still it never gets back to anyone."],
        ["credit-card", "Card numbers across a counter",
         "The card number is read out loud or written down. That is where both the errors and the risk are."],
        ["users", "Nothing to exchange at a meeting",
         "The cards run out, typing a number takes too long, and afterwards nobody can find anybody."],
        ["badge-check", "A small brand is hard to remember",
         "The name never stays on the customer's phone. Every time you start the introduction again."],
        ["file-user", "Sending a CV is awkward",
         "A PDF goes out, the link is lost, versions drift. The employer opens the oldest one."],
    ],

    "nav_answer": "The answer",
    "answer_title": "One number, one object,\neight situations.",
    "answer_body": "Every one of them is solved the same way: the phone touches an NFC object or reads a QR code, "
                   "and the page for that situation opens. Nothing is installed.",
    "answers": [
        ["Paper details", "The details are on the page, with a copy button, spelled right"],
        ["No number in the windscreen", "Car tag: a tap reaches you by call or message"],
        ["A pet goes missing", "Collar tag: whoever finds it opens the owner's page"],
        ["Keys and things", "Object tag: what is found gets back to whom it belongs"],
        ["Card numbers", "A payment page through Payme — no number is read out"],
        ["Exchanging at a meeting", "One tap and the contact is saved to the phone"],
        ["Building a brand", "The page is yours and it stays on the customer's phone"],
        ["Sending a CV", "One link, always the latest version"],
    ],

    "nav_notplain": "What is different",
    "notplain_title": "This is not an ordinary NFC card.",
    "notplain_body": "There are plenty of NFC cards. The difference is not the card — it is what stands behind it.",
    "notplain": [
        ["sparkles", "The number is yours", "A unique number in the AAA000 format. A low serial cannot be reproduced — nobody else can print it."],
        ["route", "The page changes, the object does not", "New job, new number, new company: you edit the page. The card stays the card."],
        ["chart-column", "Statistics", "How many times it opened, which link was pressed, on which day. A paper card never tells you."],
        ["languages", "Three languages", "Uzbek, Russian, English. The guest reads it in their own."],
        ["qr-code", "NFC and QR together", "A phone without NFC still opens it. It works from a printed code."],
        ["credit-card", "Local payment", "Payme is connected: subscriptions, invoices, expiry reminders."],
        ["store", "The venue half as well", "Menu, table tags, calling a waiter, a counter screen — one system."],
        ["shield-check", "The data is yours", "Delete the page whenever you like, or move it to another object."],
    ],

    "nav_size": "Market size",
    "size_title": "Market size, in soum.",
    "size_rows": [
        ["TAM", "116,900 venues", "209bn UZS / year",
         "Every catering, retail and accommodation business in Uzbekistan, at the lowest tariff"],
        ["SAM", "29,000 venues", "51.9bn UZS / year",
         "Tashkent and the regional capitals — what we can reach today"],
        ["SOM", "1,000 venues", "1.79bn UZS / year",
         "The three-year target. It is 0.9% of the whole market"],
    ],
    "size_units": [
        ["utensils-crossed", "29,582", "catering businesses · 01.08.2026"],
        ["store", "86,180", "retail businesses · 01.01.2026"],
        ["bed-double", "1,156", "hotels and accommodation · 2021"],
        ["car", "4.98m", "vehicles owned by individuals · 01.07.2026"],
    ],
    "size_source": "Source: State Committee on Statistics of the Republic of Uzbekistan (stat.uz). "
                   "Subscription figures use the lowest tariff, 149,000 UZS a month.",

    "nav_rivals": "Competition",
    "rivals_title": "The competitive picture.",
    "rivals_cols": ["Personal number", "Venue half", "Local payment", "Statistics", "Three languages"],
    "rivals": [
        ["flex", ["Yes · AAA000", "Yes", "Yes · Payme", "Yes", "Yes"], True],
        ["UNQX", ["Yes · three letters, three digits", "No", "Not known", "Not known", "Not known"], False],
        ["Popl, V1CE, Linq", ["Yes · a link", "No", "No", "Yes", "Partly"], False],
        ["QR menu services", ["No", "Menu only", "Partly", "Partly", "Yes"], False],
        ["A paper card", ["No", "No", "No", "No", "No"], False],
    ],
    "rivals_note": "UNQX is live in the Fergana Valley with personal profiles. Nobody local sells the venue half: "
                   "menu, table requests, counter screen and a monthly report in one system.",

    "nav_traction": "Who we are",
    "traction_title": "This is not a first attempt.",
    "traction": [
        ["award", "IT Park resident", "Official status, with its tax and export regime."],
        ["rocket", "Accelerators", "We have been through several accelerator programmes."],
        ["users", "Public figures", "Our NFC cards are carried by well-known people."],
        ["car", "For cars", "A car-tag series has been manufactured and sold."],
        ["building-2", "B2B sales", "We have sold NFC hardware, sites and apps to cafes, shops, clothing stores and clinics."],
        ["truck", "Manufacturers", "We work directly with the firms that make the hardware."],
    ],

    "nav_road": "Roadmap",
    "road_title": "The next eighteen months.",
    "road": [
        ["2026 · Q4", "Go live", [
            "flex.com.uz and Payme certification",
            "First 100 venues: cafes, salons, clinics",
            "Car tags and object tags on sale",
        ]],
        ["2027 · Q1", "Widen the product", [
            "Mobile app, with the partner team",
            "Pet tags and the CV page",
            "Invoicing and the monthly report automated",
        ]],
        ["2027 · Q2", "Scale the selling", [
            "500 venues",
            "A dealer network in the regional capitals",
            "Volume agreements with manufacturers",
        ]],
        ["2027 · Q3–Q4", "Across the border", [
            "1,000 venues — the SOM target",
            "A pilot in Kazakhstan and Kyrgyzstan",
            "Raise the seed round",
        ]],
    ],
    "road_note": "Dates run from the close of the round.",
}

if __name__ == "__main__":
    for lang, block in (("uz", UZ), ("en", EN)):
        path = ROOT / "deck" / f"content-{lang}.json"
        data = json.loads(path.read_text())
        data.update(block)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=1))
        print(f"  content-{lang}.json  {len(data)} keys")
