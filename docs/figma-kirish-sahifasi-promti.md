# Figma uchun promt — kirish sahifasi

Quyidagini Figma'ga to'liq ko'chiring.

---

## Vazifa

flex.com.uz uchun **kirish sahifasi** dizaynini qiling.

Joylashuvni, tartibni va bo'limlar ketma-ketligini **o'zingiz hal qiling**. Quyida
faqat sahifada nima bo'lishi kerakligi va qanday cheklovlar borligi yozilgan.
Nimani tepaga, nimani pastga qo'yish, nimani birlashtirish, nimani lenta,
nimani jadval qilish — bu sizning qaroringiz.

---

## Mahsulot nima

FLEX — O'zbekistondagi NFC vizitka platformasi.

Odam **umrbod raqam** sotib oladi: `AAA000` — uchta harf va uchta raqam.
Bu uning manzili: `flex.com.uz/MYN042`. Jami 17 576 000 ta raqam bor, boshqa
bo'lmaydi.

Raqam biror buyumga yoziladi — karta, uzuk, braslet, avtomobil vizitkasi yoki
hayvon jetoni. Telefonni tegizsangiz profil ochiladi. **Ilova o'rnatilmaydi** —
na sizda, na tegizgan odamda. NFC bo'lmasa QR ishlaydi.

Ikkita mijoz turi bor va ular butunlay boshqacha:

- **Shaxs** — o'zi uchun raqam va profil oladi. Kontakti bir tegishda o'tadi.
- **Biznes** — obyekt uchun. Kafe stoliga taglik, mehmonxona xonasiga karta,
  do'kon nuqtasiga stiker. Menyu, so'rovnoma, chaqiruv, statistika.

---

## Sahifada bo'lishi kerak

### 1. Raqam tanlash
Kiritish maydoni: `flex.com.uz/` + `AAA` + `000`. Odam terib ko'radi, band
yoki bo'shligini darhol biladi va narxini ko'radi. Bu sahifadagi eng muhim
harakat — **100 000 so'mdan** boshlanadi.

### 2. Ikkiga ayrilish
Shaxs uchunmi yoki biznes uchunmi. Tashrifchi birinchi soniyalarda o'zini
topishi kerak; noto'g'ri tomonga ketsa, qaytib kelmaydi.

### 3. Buyumlar
Har biri rasmi va narxi bilan:

| Buyum | Narx |
|---|---|
| Karta | 200 000 so'm |
| Braslet | 250 000 so'm |
| Uzuk | 350 000 so'm |
| Avtovizitka (oynaga) | so'rov bo'yicha |
| Hayvon jetoni (bo'yinbog'ga) | so'rov bo'yicha |

### 4. Yo'nalishlar
Kafe va restoran · Mehmonxona · Savdo do'koni · Boshqa (salon, klinika, ofis).
Har biri o'z sahifasiga olib borishi kerak — hammasi bitta joyga tushsa,
odam o'zinikini yana qidiradi.

### 5. Profil qanday ko'rinadi
Yettita tayyor maket bor: NFC vizitka (uch rangda), Zarbof, Ijtimoiy, Plakat,
Kvitansiya. Xaridor o'zinikini tanlaydi.

### 6. Sinab ko'rish
Haqiqiy profilni ochadigan yo'l — QR yoki havola. Namuna rasm emas, ishlaydigan
sahifa.

### 7. Qanday ishlaydi
Uch qadam: raqam tanlaysiz → buyum tanlaysiz → tegizasiz.

### 8. To'rtta shubha
Odamlar aynan shularni so'raydi:
- NFC yangi texnologiyami? (yo'q, kartangizda allaqachon bor)
- Telefonimda NFC yo'q bo'lsa?
- Karta yo'qolsa nima bo'ladi?
- Ma'lumotlarim qayerda saqlanadi?

### 9. Hozirgacha nima bor
Nechta raqam band, nechtasi qolgan, oxirgi qo'shilganlar. Da'vo emas —
sanalgan raqam.

### 10. Narxlar
- **Shaxs:** raqam 100 000 so'mdan · Premium 49 000 so'm/oy yoki 490 000 so'm/yil
- **Kompaniya:** har xodim uchun 29 000 so'm/oy
- **Obyekt:** 15 nuqtagacha 149 000 so'm/oy · 40 nuqtagacha 299 000 so'm/oy ·
  undan ko'pi kelishuv bo'yicha

To'lov: Payme, Click, Uzum. Toshkentda ertaga yetkaziladi.

### 11. Savol-javob va futer
Kompaniya rekvizitlari, ommaviy oferta, yetkazib berish shartlari.

---

## Cheklovlar

**Uch til.** O'zbekcha asosiy, ruscha va inglizcha ham bor. Ruscha matn
o'zbekchadan ~15% uzun — maket ikkalasini ham sig'dirishi kerak, qayta
chizilmasin. O'zbek lotinida `oʻ gʻ ʼ` belgilari bor, ruschada kirill —
tanlagan shrift **ikkalasini ham** qo'llashi shart.

**Ikki kenglik.** Telefon (375pt) va kompyuter. Ikkalasida ham to'liq ishlashi
kerak, telefon versiyasi qisqartirilgan bo'lmasin.

**Bu sayt ham, ilova ham.** Telefonga o'rnatilganda xuddi shu sahifa ilovaning
bosh ekraniga aylanadi — brauzer paneli bo'lmaydi. Ya'ni pastda barmoq
yetadigan navigatsiya kerak.

**Kirgan foydalanuvchi.** Raqami bor odam kirsa, sotuv matni o'rniga **o'z
raqamlari, bugungi ko'rishlar soni va yangi so'rovlari** chiqishi kerak.
Bir sahifa, ikki holat.

**Brend.** Laym `#ABFF09`, deyarli qora `#0E0A1B` ustida. Laym — byudjet:
bir ekranda **bitta** laym element bo'ladi, u sahifa nima uchun mavjudligini
belgilaydi. Ikkinchi laym birinchisini bekor qiladi. Laym hech qachon matn
yoki ramka bo'lmaydi — oq fonda 1.2:1, o'qib bo'lmaydi.

**O'lchamlar.** Hech qanday matn 16px dan kichik emas, bosiladigan har bir
element 44pt dan baland. Foydalanuvchi ko'chada, tik turgan holda, ba'zan
qo'lqopda bosadi.

---

## Nima kerak emas

- Telefon ichida telefon ko'rsatmang
- Emoji ikonka o'rnida ishlatmang
- Soxta odam, soxta e-pochta, soxta raqam yozmang — namuna kerak bo'lsa
  o'ylab topilgan tashkilot nomini yozing
- Katta gaplar: "eng yaxshi", "inqilobiy", "raqamli kelajak" — mahsulot
  nima qilishini ayting, kifoya
