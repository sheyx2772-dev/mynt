# NFC profil — ijtimoiy qatlam

Maqsad: NFC profil Telegram va Instagram darajasida ishlasin. Yopiq profil,
obuna, tanlab ko'rsatish, musiqa, ochilish animatsiyasi, tug'ilgan kun, sovg'a
stikerlari.

Bu hujjat **qurish uchun**: har bir band uchun nimasi bor, nimasi yo'q va
qaysi tartibda qilinishi yozilgan. Tartib tasodifiy emas — pastdagi har bir
bosqich o'zidan oldingisiga suyanadi.

---

## 0. Nimasi allaqachon bor

Buni bilmasdan boshlash — ikkinchi marta yozish demak.

| Bor | Qayerda |
|---|---|
| `follows` jadvali, `follower_count` | migratsiya 00008 |
| `posts`, `post_count`, lenta (`/lenta`) | 00008 |
| `profile_comments`, `comments_open` | 00016 |
| Bildirishnomalar + Telegram yetkazish | 00029 |
| Tarif: `free` / `premium`, `plan_expires_at` | 00021 |
| To'lov: Click, Payme, promokod | 00003, 00043 |
| `profile_views`, `link_clicks` — statistika | 00004 |
| `recommendations` — tavsiya | 00033 |

Ya'ni **obuna, post, izoh, bildirishnoma va to'lov** allaqachon ishlaydi.
Yetishmayotgani — maxfiylik, tanlab ko'rsatish va sovg'a iqtisodi.

---

## 1. Yopiq profil va obuna so'rovi

Hammasining poydevori. Qolgan bandlarning yarmi shunga suyanadi.

**Nimasi yo'q:** `handles` da maxfiylik ustuni yo'q, `follows` esa so'rovsiz —
bosdingiz, obuna bo'ldingiz.

**Nima qilinadi:**

```sql
alter table handles add column if not exists yopiq boolean not null default false;

create table if not exists follow_requests (
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  handle text not null,
  holat text not null default 'kutilmoqda'
    check (holat in ('kutilmoqda','qabul','rad')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (requester_user_id, handle)
);
```

Qoidalar, ular kodda emas — bazada:

- Yopiq profilga obuna **so'rovdan** o'tadi. Qabul qilinganda `follows` ga
  qator qo'shiladi va `follower_count` triggeri o'zi ko'taradi.
- Ochiq profil avvalgidek darhol obuna bo'ladi.
- Egasi so'rovni rad etsa qator qoladi (`rad`), chunki qayta-qayta so'rashning
  oldini olish kerak.

**Nima ko'rinadi:** yopiq profilda begonaga faqat ism, surat, raqam va obuna
tugmasi. Havolalar, postlar, xizmatlar, statistika — yo'q. Bu **serverda**
kesiladi, brauzerda yashirilmaydi: yashirilgan narsa sahifa manbasida turadi.

**Rezidentlar:** `/rezidentlar` katalogida yopiq profil ham ko'rinadi — ism,
raqam, shahar. Ochilganda esa yuqoridagi qisqartirilgan ko'rinish. Ya'ni
"mijozlar bir-birini bemalol ko'radi" bandi shu bilan bajariladi, lekin
ma'lumot yopiq qoladi.

---

## 2. Tanlab ko'rsatish

Har bir havola va telefon raqami alohida yoqiladi/o'chiriladi.

Hozir `handles.phone`, `contact_email` va `links` bor — hammasi yoki hech
narsa. Kerak: har bir maydonga uchta holat.

```
ochiq    — hammaga
obuna    — faqat obunachilarga
yopiq    — faqat egasiga
```

`links` allaqachon `jsonb`, ya'ni migratsiyasiz har bir havolaga
`"korinish": "obuna"` qo'shiladi. `phone` va `contact_email` uchun ikkita
kichik ustun kerak.

Bu 1-bosqichdan keyin arzon: kesish mantig'i o'sha joyda yoziladi.

---

## 3. Ochilish animatsiyasi

Telefon tegizilganda avval qora ekranda `FLEX`, keyin profil — Apple telefoni
yonganidek.

Bu **eng arzon va eng ko'zga tashlanadigan** band, shuning uchun 1-bosqichdan
keyin darhol.

- Faqat `?src=nfc` va `?src=qr` bilan kelganda. Havoladan yoki qidiruvdan
  kelgan odam buni ko'rmaydi — u kutmagan sekinlik bo'ladi.
- ~900 ms, keyin profil. `prefers-reduced-motion` da umuman yo'q.
- Bir marta: `sessionStorage` da belgi qoladi, orqaga qaytganda takrorlanmaydi.
- Profil orqada allaqachon yuklanib turadi, ya'ni animatsiya kutish emas —
  kutishning ustini yopadi.

---

## 4. Musiqa

Profilda qo'shiq. Premium.

Ikki yo'l bor va tanlash kerak:

**a) Fayl yuklash.** R2 allaqachon ulangan. Lekin mualliflik huquqi bizning
zimmamizga tushadi va 3 daqiqalik mp3 — 3 MB, ya'ni tegizgan odam uni yuklab
oladi.

**b) Havola qo'yish** — Spotify, YouTube Music, Apple Music. Hech narsa
saqlanmaydi, huquq muammosi yo'q, lekin ijro uchun tashqi ilova ochiladi.

Tavsiya: **(b) dan boshlash**, keyin talab bo'lsa (a) ni qo'shish. Avtoijro
umuman yo'q — brauzerlar to'sadi va u bezovta qiladi.

---

## 5. Tug'ilgan kun

`handles.tugilgan_kun date` — faqat kun va oy ko'rsatiladi, yil saqlanadi
lekin hech qachon chiqmaydi.

- O'sha kuni profilda tabrik: konfeti, emoji, "Bugun tug'ilgan kun".
- Obunachilariga bildirishnoma — Telegram orqali, 00029 dagi tayyor yo'l bilan.
- Egasi o'chirib qo'ya oladi.

---

## 6. Sovg'a stikerlari

Eng katta band, oxirida — chunki u to'lov, do'kon va inventarni talab qiladi.

```
stickers          — nima sotiladi: nom, rasm, narx, chiqarilgan soni
sticker_purchases — kim sotib oldi
sticker_gifts     — kim kimga sovg'a qildi, qachon
```

Muhim qarorlar, hozir hal qilinmasa keyin qimmat:

- **Cheklangan soni bo'lsin.** Telegramda sovg'aning qiymati kamyobligidan.
  Cheksiz stiker — bepul stiker.
- **Sovg'a profilda ko'rinadi.** Kim yuborgani bilan. Aks holda sotib olishning
  ma'nosi yo'q.
- **Pul Click/Payme orqali**, ya'ni tayyor yo'l. Yangi provayder kerak emas.
- **Qaytarish yo'q** — ofertaga alohida band yoziladi.

---

## 7. «Telegram Premium imkoniyatlari»

Bu banddan bittasi ham mustaqil emas — u ro'yxat, xususiyat emas. Ichidan
NFC profilga mos keladiganlari:

| Telegramda | Bizda nima bo'ladi | Bosqich |
|---|---|---|
| Yopiq akkaunt | 1-bosqich | ✅ rejada |
| Kim ko'rganini yashirish | `profile_views` da anonim rejim | 2 |
| Animatsiyali avatar | qisqa video avatar (R2) | keyin |
| Maxsus emoji / belgilar | sovg'a stikerlari | 6 |
| Reklama yo'q | bizda reklama yo'q | — |
| Katta fayl | kerak emas | — |

Ya'ni bu band alohida ish emas: 1, 2 va 6-bosqichlar uni qoplaydi.

---

## Tartib va sabab

1. **Yopiq profil va so'rov** — poydevor, 2 va 7 shunga suyanadi
2. **Ochilish animatsiyasi** — arzon, darhol ko'rinadi, hech narsaga bog'liq emas
3. **Tanlab ko'rsatish** — 1 dan keyin arzon
4. **Tug'ilgan kun** — kichik, bildirishnoma yo'li tayyor
5. **Musiqa** — havola bilan boshlanadi
6. **Sovg'a stikerlari** — eng katta, oxirida

Har bosqichda tekshiriladigan narsa bitta: **begona odam yopiq profildan nima
ko'ra oladi?** Javob "ism, surat, raqam" bo'lishi shart — sahifa manbasida ham.
