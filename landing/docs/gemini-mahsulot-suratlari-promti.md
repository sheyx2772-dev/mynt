# Gemini uchun promt — mahsulot suratlarini fondan ajratish

Har bir suratni **alohida** yuboring (bittadan, birga emas — bir nechta rasm
berilsa model ularni aralashtirib yuboradi). Har safar quyidagi matnni
yozing.

---

## Promt (har bir surat bilan)

```
Bu — sotuvdagi jismoniy mahsulotning haqiqiy studiya surati.

Vazifang: fonni to'liq olib tashla, mahsulotning o'zini o'zgarishsiz qoldir.

QAT'IY TALABLAR:
- Fon butunlay shaffof (alpha) bo'lsin. Oq fon emas, shaffof.
- Mahsulotning shakli, rangi, materiali, yaltirashi va yozuvlari
  o'zgarmasin. Sen uni qayta chizmaysan — faqat fonini olib tashlaysan.
- Fondagi soyani ham olib tashla. Mahsulot ostidagi soya kerak emas.
- Chetlari toza bo'lsin: oq halo, kulrang hoshiya yoki yarim shaffof
  qoldiq bo'lmasin. To'q rangli fonda tekshirilganda chetida hech qanday
  yorug' chiziq ko'rinmasligi kerak.
- Mahsulotning hech bir qismini kesib qoldirma.
- Chiqish formati: PNG, shaffof fon, kamida 1200px kenglikda.

QILMA:
- Mahsulotni qayta chizma, "yaxshilama", rangini yoki shaklini o'zgartirma
- Yangi soya, aks, yaltiroq yoki fon effekti qo'shma
- Ramka, matn, logotip yoki suv belgisi qo'shma
- Mahsulotni boshqa burchakka burma yoki qayta joylashtirma

Natija: faqat mahsulot, shaffof fonda, chetlari toza.
```

---

## Agar Gemini shaffof fon bera olmasa

Ba'zi modellar PNG alpha chiqara olmaydi va oq fonda beradi. Shunda quyidagini
qo'shing:

```
Agar shaffof fon chiqara olmasang, mahsulotni TOZA YASHIL fonda ber:
RGB (0, 255, 0), boshqa hech qanday rang aralashmasin, gradient bo'lmasin.
Mahsulotning o'zida yashil rang bo'lmasligi kerak.
```

Yashil fon keyin kodda olib tashlanadi — oq fondan farqli, u mahsulot
ranglariga aralashmaydi.

---

## Qaysi suratlarni yuborish kerak

Loyihadagi `public/mahsulot/` papkasidan:

| Yuboriladigan fayl | Nima |
|---|---|
| `karta.jpg` | Karta — 200 000 so'm |
| `uzuk.jpg` | Uzuk — 350 000 so'm |
| `braslet.jpg` | Braslet — 250 000 so'm |
| `avtovizitka.jpg` | Avtovizitka — so'rov bo'yicha |
| `hayvon-teg.jpg` | Hayvon jetoni — so'rov bo'yicha |

Natijalarni **o'sha nomda**, `.png` kengaytmasi bilan saqlang:
`karta.png`, `uzuk.png`, `braslet.png`, `avtovizitka.png`, `hayvon-teg.png`

---

## Tekshirish

Har bir natijani **to'q rangli fonga** qo'yib ko'ring (masalan Preview'da yoki
Telegramning tungi rejimida). Chetida oq yoki kulrang chiziq ko'rinsa, o'sha
faylni qayta so'rang — aynan shu nuqson menda avtomatik kesganda chiqqan edi.
