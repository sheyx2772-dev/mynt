# FLEX — mahsulot rasmlari uchun AI promptlar

Bularni istalgan AI rasm generatoriga (ChatGPT / Gemini / Midjourney / Leonardo)
qo'ying. Chiqqan rasmni quyidagi nom bilan `public/mahsulot/` papkasiga tashlang —
sayt uni o'zi topib ishlatadi, kod o'zgartirish shart emas.

| Fayl nomi              | Nima uchun              | Nisbat |
|------------------------|-------------------------|--------|
| `karta.jpg`            | Bosh sahifa hero        | 16:9   |
| `uzuk.jpg`             | Qurilmalar bo'limi      | 1:1    |
| `braslet.jpg`          | Qurilmalar bo'limi      | 1:1    |
| `tegizish.jpg`         | "Qanday ishlaydi"       | 16:9   |

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

Fayllarni `public/mahsulot/` ichiga yuqoridagi nomlar bilan tashlang, xolos.
`.jpg`, `.png` yoki `.webp` — farqi yo'q, sayt uchalasini ham qabul qiladi.
Rasm yo'q bo'lsa sayt hozirgi chizilgan variantni ko'rsatib turaveradi, sinmaydi.
