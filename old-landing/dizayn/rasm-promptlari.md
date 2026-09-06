# FLEX — mahsulot rasmlari uchun AI promptlar

Bularni istalgan AI rasm generatoriga (ChatGPT / Gemini / Midjourney / Leonardo)
qo'ying. Chiqqan rasmni quyidagi nom bilan `public/mahsulot/` papkasiga tashlang —
sayt uni o'zi topib ishlatadi, kod o'zgartirish shart emas.

| Fayl nomi              | Nima uchun              | Nisbat | Holat |
|------------------------|-------------------------|--------|-------|
| `karta.jpg`            | Bosh sahifa hero        | 16:10  | bor   |
| `uzuk.jpg`             | Qurilmalar              | 1:1    | bor   |
| `braslet.jpg`          | Qurilmalar              | 1:1    | bor   |
| `oila.jpg`             | "Qurilmani tanlang"     | 16:9   | bor   |
| `tegizish.jpg`         | "Tegizing"              | 16:9   | yo'q  |
| `kafe.jpg`             | Biznes — kafe           | 16:9   | bor   |
| `mehmonxona.jpg`       | Biznes — mehmonxona     | 16:9   | bor   |
| `salon.jpg`            | Biznes — boshqa obyekt  | 4:3    | bor   |
| `biznes.jpg`           | Biznes sahifasi hero    | 3:4    | bor   |
| `avto.jpg`             | ishlatilmayapti         | 16:9   | bor   |
| `avtovizitka.jpg`      | Shaxsiy — avtovizitka   | 16:9   | bor   |
| `dokon.jpg`            | Biznes — savdo do'koni  | 16:9   | yo'q  |

Ranglar butun sayt bo'ylab ikkitagina: chuqur qora `#0e0a1b` va kislotali
yashil `#abff09`. Promptlarda shu ikkisidan boshqa rang so'ralmagan — shuning
uchun rasmlar saytga o'zi yopishadi.

---

## 1. karta.jpg — 16:9

> Product photograph of a matte black metal NFC business card resting at a slight
> angle on a smooth dark charcoal surface. The card is plain matte black with no
> logos except a small acid-lime green wordmark reading "FLEX" in the lower left
> corner and a thin lime green contactless wave symbol etched in the top right.
> Single-source studio lighting from the upper left, soft falloff, deep shadows,
> a thin lime green rim light along one edge of the card. Photorealistic, shallow
> depth of field, luxury tech product photography. Colour palette strictly black
> and acid lime green (#abff09) only. No people, no other brand logos, no text
> besides FLEX.

## 2. uzuk.jpg — 1:1

> Macro product photograph of a polished black ceramic smart ring standing upright
> on a dark charcoal reflective surface. The ring is a smooth black band with one
> thin acid-lime green line running around its outer circumference. Studio lighting
> from above and behind, a lime green glow spilling from behind the ring, soft
> reflection beneath it. Photorealistic, extremely shallow depth of field, luxury
> jewellery product photography. Colour palette strictly black and acid lime green
> (#abff09) only. No text, no logos, no people.

## 3. braslet.jpg — 1:1

> Product photograph of a black silicone wristband with a small matte black oval
> plate set into the strap, coiled loosely on a dark charcoal surface. Thin acid-lime
> green chevron accents are moulded into the silicone beside the plate. Studio
> lighting from the upper right, soft shadow, a faint lime rim light along the top of
> the strap. Photorealistic, shallow depth of field, modern wearable product
> photography. Colour palette strictly black and acid lime green (#abff09) only. No
> text, no logos, no people, no watch face, no screen.

## 4. tegizish.jpg — 16:9

> Close-up photograph of a hand holding a matte black card and tapping it against the
> back of a black smartphone, in a dark room. Acid-lime green light glows at the point
> of contact, casting a soft green spill onto both surfaces and the fingers. Everything
> else is deep black. Photorealistic, cinematic lighting, shallow depth of field, moody
> dark technology photography. Colour palette strictly black and acid lime green
> (#abff09) only. No text, no logos, no visible faces, no brand marks.

---

## Tushirgandan keyin

`scripts/prep-shots.py` rasmni kesadi, o'lchamini keltiradi va yashil rangni
brend lime'iga suradi. Generator yashilni zumrad (~153°) qilib chiqaradi, brend
esa ~80° — faqat yashil diapazon suriladi, shuning uchun kadrdagi issiq marmar
va yog'och (~29°) tegilmay qoladi.

Fayllarni `public/mahsulot/` ichiga yuqoridagi nomlar bilan qo'lda tashlasangiz
ham bo'ladi. `.jpg`, `.png` yoki `.webp` — farqi yo'q. Rasm yo'q bo'lsa sayt
chizilgan variantni ko'rsatib turaveradi, sinmaydi.


---

## Biznes yo'nalishi uchun

Bu to'rttasi 2-sentyabrda qo'shildi (Gemini). Bo'lmasa ham sayt ishlaydi —
o'rnida chizilgan ekran maketi turadi; rasm bo'lsa maketning tepasiga keng
lenta bo'lib chiqadi. Almashtirmoqchi bo'lsangiz, quyidagi promptlar o'sha
uslubni qaytaradi.

`biznes.jpg` — biznes sahifasining sarlavhasi yonidagi tik rasm (3:4).

### kafe.jpg — 21:9

> Wide cinematic photograph of a dark restaurant table from above at a slight
> angle. On the table sits a small matte black acrylic table stand, about the
> size of a playing card, with a thin acid-lime green contactless wave symbol
> etched on its face. A hand holds a phone just above it, mid-tap, the screen
> not readable. Warm low restaurant lighting, deep shadows, a lime green rim
> light on the edge of the stand. Photorealistic, shallow depth of field.
> Colour palette strictly black, warm neutral and acid lime green (#abff09).
> No faces, no logos, no readable text.

### mehmonxona.jpg — 21:9

> Wide cinematic photograph of a hotel room bedside table. A slim matte black
> stand rests beside a lamp, with a thin acid-lime green contactless wave
> symbol on its face. Soft evening light through a window out of focus behind.
> Photorealistic, shallow depth of field, calm and expensive. Colour palette
> strictly black, warm neutral and acid lime green (#abff09). No people, no
> logos, no readable text.

### salon.jpg — 21:9

> Wide cinematic photograph of a beauty salon station: a mirror edge, a chair
> back and a small matte black NFC tag mounted at the side of the mirror with a
> thin acid-lime green contactless wave symbol. Bright clean lighting, mostly
> black and white surfaces. Photorealistic, shallow depth of field. Colour
> palette strictly black, white and acid lime green (#abff09). No people, no
> logos, no readable text.


### avtovizitka.jpg — 16:9

`avto.jpg` (avtobus) hozir hech qayerda ishlatilmayapti — avtopark alohida
yo'nalish bo'lishdan to'xtadi. O'chirmadim: kerak bo'lsa joyida turibdi.

Ikkalasi ham tik rasmdan qirqilgan: old oyna, telefon va QR plastina kadrda
qolgan. Qayta qirqish kerak bo'lsa `public/mahsulot/` ga tik rasmni tashlab,
`Image.crop((0, top, w, top + w*9/16))` bilan olinadi — avtobusda `top=600`,
yengil avtoda `top=585`.

> Wide photograph through a windscreen from outside: a phone in a dashboard
> mount and a matte QR plate on the dash beside it. Daylight, the street
> reflected in the glass. Photorealistic. No readable text, no logos.


### dokon.jpg — 16:9

> Wide photograph of a small shop counter beside the till. A slim matte black
> NFC plate with a thin acid-lime contactless wave symbol stands next to the
> card terminal; a customer's hand holds a phone above it. Warm shop lighting,
> shelves out of focus behind. Photorealistic, shallow depth of field. Colour
> palette black, warm neutral and acid lime green (#abff09). No faces, no
> logos, no readable text.
