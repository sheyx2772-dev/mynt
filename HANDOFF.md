# Boshlash uchun

Loyihani birinchi marta qo'lga olayotgan bo'lsangiz — dasturchi ham, AI yordamchi
ham — shu fayldan boshlang. Batafsili `README.md` da.

## Loyiha nima

Flex — NFC orqali ochiladigan shaxsiy profil va noyob raqamlar bozori.
Foydalanuvchi 3 harf + 3 raqamdan iborat raqam sotib oladi (masalan `FLX007`),
u `flex.com.uz/FLX007` manzilida profilini ochadi. Raqamni karta, uzuk yoki
braslet ko'rinishida olib yuradi — tanlov foydalanuvchiniki, profil bitta.

## Hozirgi holat

| | |
|---|---|
| Sayt | https://flex-five-kohl.vercel.app — ishlayapti |
| Deploy | Vercel, `main` ga har push avtomatik chiqadi |
| Baza | Supabase, migratsiyalar 0001–0013 qo'llangan |
| Payme | ishlayapti, production'da tekshirilgan |
| Click | yarim — `service_id` bor, `merchant_id` va kalit yo'q |
| Domen | `flex.com.uz` olingan, DNS hali yo'naltirilmagan |

Nima qolganini `README.md` dagi **"The payment accounts"** va
**"Before deploying"** bo'limlari aniq yozadi.

## Kalitlar qayerda

Hech bir kalit repoda yo'q va bo'lmasligi ham kerak. `.env.example` faqat
nomlarni sanaydi. Qiymatlar ikki joyda:

| Kalit | Qayerdan olinadi |
|-------|------------------|
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `R2_*` | Cloudflare → R2 → API tokens |
| `PAYME_MERCHANT_ID`, `PAYME_SECRET_KEY` | merchant.payme.uz → Kassalar → Sozlamalar → Инструменты разработчика |
| `CLICK_SERVICE_ID` | mc.click.uz → Сервисы (99108) |
| `CLICK_MERCHANT_ID` | kabinetda ko'rsatilmaydi — Click'dan so'rash kerak |
| `CLICK_SECRET_KEY` | mc.click.uz → Сервисы → ko'z belgisi |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |
| `ANALYTICS_SALT` | istalgan uzun tasodifiy satr; **bir marta qo'yiladi va o'zgartirilmaydi** |

Production'dagi qiymatlar Vercel → Settings → Environment Variables da turadi.

Payme va Click hisoblari **MC LEGAL** firmasiga tegishli, shartnoma
`B/D 29279\TASH`. Ikkalasi ham dastlab tijoraat.uz uchun ochilgan.

## Ishga tushirish

```bash
npm install
cp .env.example .env.local     # qiymatlarni yuqoridagi jadval bo'yicha to'ldiring
npm run dev
```

Tekshiruvlar:

```bash
npx tsc --noEmit && npx eslint src/ && npx vitest run
npm run db:test                # Docker kerak: migratsiyalarni haqiqiy Postgres'da sinaydi
```

## Ish yuritish bo'yicha eslatmalar

Bular bir necha kunlik ishda o'z-o'zidan aniqlangan narsalar. Yozib qo'yilmasa,
keyingi odam ularni qaytadan boshdan kechiradi.

**Egasi dasturchi emas.** Ko'rsatma berib qo'yish ishlamaydi — ish o'zi
bajarilishi kerak. Buyruq berilsa, u odatda bajarilmay qoladi.

**Migratsiyalar brauzer orqali qo'llanadi.** `SUPABASE_ACCESS_TOKEN` yo'q, ya'ni
`npm run db:migrate` ishlamaydi. SQL Supabase SQL muharririga qo'yiladi. Monaco
muharririga matnni `monaco.editor.getModels()[0].setValue(...)` bilan yozish
mumkin — nusxalash-qo'yish u yerga o'tmaydi.

**Brauzer panelida "qo'yish" jimgina ishlaydi.** ⌘V sahifaga yetadi, lekin
panel darrov qayta chizmaydi. Foydalanuvchi hech nima bo'lmadi deb yana bosadi.
Bir marta bosishni so'rang, keyin DOM'dan qatorlarni **sanab** tekshiring.

**Next'ning rasm keshi eskirib qoladi.** `public/` dagi rasm almashtirilsa,
`_next/image` eskisini berishda davom etadi. `rm -rf .next` va serverni qayta
ishga tushirish kerak. `next dev` ishlab turganda `npm run build` ishlatilsa,
kesh buziladi.

**Generator yashilni har xil chiqaradi.** Studiya kadrlari ~150°, tegizish
kadri ~111° bo'lib keldi. `scripts/prep-shots.py` har bir rasmning o'z
yashilini o'lchab, brend lime'iga (82°) suradi — qat'iy burilish emas.

## Nimalarni qilmaslik kerak

**Davlat gerbi va bayrog'i** sotiladigan kartaga bosilmaydi — qonun bilan
tartibga solingan. O'rniga Humo qushi, paxta-bug'doy gulchambari, naqsh yoki
xarita ishlatiladi. `src/lib/ai-design.ts` dagi `screenWish` buni so'rov
darajasida to'xtatadi.

**Begona brend va film qahramonlari** ham shunday. Raqobatchi buni qilyapti;
bu uning zaif joyi, bizning emas.

**`output: "standalone"`** `next.config.ts` ga qaytarilmasin — Vercel deploy'i
yiqiladi. Sababi o'sha faylda yozilgan.
