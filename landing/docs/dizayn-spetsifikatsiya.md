# FLEX — dizayn spetsifikatsiyasi

Manba: Fable 5.1 (arena.ai), 2026-09-03. Bu hujjat *qurish uchun* yozilgan —
har bir raqam qaror, har bir qoida sababi bilan.

Asosiy tashxis: hozirgi tizim butun mahsulotga **bitta yuz** beradi (qora tech
dashboard). Aslida FLEX'da uchta mutlaqo boshqa vaziyat bor, va ular bitta
dizayn tilini baham ko'ra olmaydi.

| Yuz | Kim ko'radi | Fon | Vazifasi |
|---|---|---|---|
| **Qog'oz** (paper) | Notanish mehmon, tegib ochgan odam | `#FAFAF8` | Bitta harakat: saqlash / yozish / chaqirish / to'lash |
| **Siyoh** (ink) | Egasi, o'z telefonida, kabinet | `#0E0A1B` | Zich ma'lumot, tez qaror |
| **Signal** (wall) | Devordagi planshet: kassa, stol qurilmasi | `#0E0A1B` | 2 metrdan o'qiladigan, doim yoniq |

Xulosa bir jumlada: hozir "qora tech dashboard hamma joyda"; kerak — **"raqam
atrofida qurilgan hujjat tizimi — notanishga oq va sodda, egaga qora va zich,
devordagi ekranga katta va yoniq"**.

---

## 0. Umumiy poydevor

### 0.1 Tokenlar — Tailwind v4 `@theme`

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Asosiy uchlik */
  --color-ink: #0E0A1B;
  --color-lime: #ABFF09;
  --color-lime-press: #9AEC00;
  --color-paper: #FAFAF8;

  /* Qog'oz yuz (A) uchun hosilalar */
  --color-white: #FFFFFF;
  --color-ink-2: #4A465A;   /* ikkilamchi matn, paper ustida 8.1:1 */
  --color-ink-3: #736F82;   /* izoh matn, paper ustida 4.7:1 */
  --color-line: #E6E4EC;    /* chegara */
  --color-line-2: #CFCCD8;  /* kuchli chegara, input */
  --color-fill: #F1F0F4;    /* pasiv to'ldirish */

  /* Siyoh yuz (B, C) uchun hosilalar */
  --color-ink-s1: #16122A;  /* kartochka */
  --color-ink-s2: #1F1A36;  /* ko'tarilgan, hover */
  --color-ink-line: #2B2644;
  --color-paper-2: #B3AFC2; /* ikkilamchi matn, ink ustida 9.3:1 */
  --color-paper-3: #7F7B92; /* izoh, ink ustida 4.6:1 */

  /* Semantik — ikkala yuz uchun alohida */
  --color-danger: #C9302A;      --color-danger-ink: #FF6B5E;
  --color-warn: #A86A12;        --color-warn-ink: #FFC24B;

  /* Shrift */
  --font-display: "Unbounded", "Inter", system-ui, sans-serif;
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Radius */
  --radius-plate: 8px;
  --radius-input: 12px;
  --radius-card: 16px;
  --radius-tile: 24px;

  /* Harakat */
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --dur-1: 120ms;
  --dur-2: 200ms;
  --dur-3: 240ms;
}

html {
  font-family: var(--font-sans);
  font-feature-settings: "cv11", "ss01";
  -webkit-text-size-adjust: 100%;
}
.num { font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0ms !important;
    animation: none !important;
  }
}
```

### 0.2 Shrift qarori — Space Grotesk olib tashlanadi

**Jiddiy xato:** Space Grotesk'da kirillcha yo'q. Menyu uch tilda; ruscha
sarlavha ("Салаты", "Горячее") avtomatik boshqa shriftga tushadi va sahifa
"buzilgan" ko'rinadi. O'zbekiston auditoriyasining yarmi kirill o'qiydi, kafe
menyulari deyarli hamma joyda ruscha dublga ega. **Darhol almashtiriladi.**

| Oila | Qayerda | Vazn | Sabab |
|---|---|---|---|
| **Unbounded** | Faqat: AAA000 raqami, DEVOR'dagi katta raqamlar, bosh sahifa sarlavhasi, KPI raqamlari | 600, 700 | Kirillcha bor, keng, raqamlar bir-biridan farqlanadi (0/O, 1/I muammosi yo'q) |
| **Inter** | Boshqa hamma narsa: sarlavhalar, matn, tugmalar | 400, 500, 600 | Kirill + oʻ/gʻ (U+02BB) bor, 13px da ham o'qiladi |

Ikkalasi ham `next/font/google`, `subsets: ["latin","latin-ext","cyrillic"]`,
`display: "swap"`. Unbounded faqat 600/700 — 2 fayl.

```ts
// src/app/fonts.ts
import { Inter, Unbounded } from "next/font/google";
export const inter = Inter({ subsets: ["latin","latin-ext","cyrillic"], weight: ["400","500","600"], variable: "--font-sans", display: "swap" });
export const unbounded = Unbounded({ subsets: ["latin","cyrillic"], weight: ["600","700"], variable: "--font-display", display: "swap" });
```

### 0.3 `<Plate>` — uch tizimda ham bir xil komponent

**Raqam — brend.** AAA000 bu logotip. O'zbekistonda chiroyli raqam madaniyati
kuchli: 777 li avtoraqam, 001 li telefon raqami pulga sotiladi. FLEX raqami
umrbod va noyob — ya'ni u pasport raqami, avtoraqam, chipta raqami kabi
**hujjat**. Dizayn shu metaforada qurilishi kerak.

Har joyda bir xil: Unbounded 700, `letter-spacing: 0.06em`, ink fon, paper
matn, radius 8. Chap tomonda 3px lime chiziq **yo'q** (lime qoidasi buziladi).
Faqat ikki rang.

```tsx
export function Plate({ n, size = "md" }: { n: string; size?: "sm"|"md"|"lg"|"xl" }) {
  const s = {
    sm: "h-6 px-2 text-[12px]",
    md: "h-8 px-2.5 text-[15px]",
    lg: "h-12 px-4 text-[24px]",
    xl: "h-20 px-6 text-[44px]",
  }[size];
  return (
    <span className={`inline-flex items-center rounded-plate bg-ink text-paper font-display font-bold tracking-[0.06em] num ${s}`}>
      {n}
    </span>
  );
}
```

Qoida: Plate hech qachon oq fonli, hech qachon lime, hech qachon ko'k havola
emas. Bosilganda nusxa oladi.

**Fizik → digital bog'liqlik ko'z bilan ko'rinadi:** profil sahifasi tepasida
kartaning o'zi turadi (rangi, materiali, raqami bilan). Tegilgan uzuk ham,
karta ham shu ko'rinishni ochadi.

### 0.4 Yuzni tanlash — `data-surface`

Har layout ildizida bitta atribut. Komponentlar ichida yuzga qarab shartli
klass **emas** — uchta alohida komponent to'plami.

```
src/app/
  (guest)/[code]/layout.tsx    → <html data-surface="paper">   A
  (owner)/kabinet/layout.tsx   → <html data-surface="ink">      B
  (wall)/devor/[id]/layout.tsx → <html data-surface="wall">     C
```

Bitta `Button` ichida `if (surface === ...)` qilmang — uch oydan keyin
hammasi aralashib ketadi. `ui/paper/*`, `ui/ink/*`, `ui/wall/*`.

### 0.5 So'm formati (alohida qoida)

`45 000 so'm` — ming ajratgichi **bo'shliq** (nuqta yoki vergul emas), tiyin
yo'q, `so'm` so'zi kichik, raqamdan ajralmaydigan bo'shliq bilan. Telefon:
`+998 90 123 45 67`. Mayda, lekin mahalliy mahsulotni chetdan ko'chirilganidan
ajratib turadigan narsa.

Raqamlar hamma joyda `tabular-nums`: narxlar, stol raqamlari, vaqtlar ustun
bo'lib turishi kerak.

---

## A. MEHMON — Qog'oz yuz

**Kim:** kartaga tegib ochgan notanish odam. Telegram ichki brauzeri,
Redmi/Samsung A-seriya, quyosh, 3G. Bir marta ko'radi, bir ish qiladi, yopadi.

**Sabab uchta:** quyoshda o'qilishi, arzon Android'da render og'irligi, va oq
sahifa "hujjat"ga o'xshaydi — qora sahifa "ilova"ga. Mehmon ilova kutmagan, u
kartaga tegdi.

**Bosh qoida:** sahifada bitta harakat, bitta lime, hech qanday tekstura.

### Ranglar

| Rol | Hex | Klass |
|---|---|---|
| Sahifa foni | `#FAFAF8` | `bg-paper` |
| Kartochka foni | `#FFFFFF` | `bg-white` |
| Asosiy matn | `#0E0A1B` | `text-ink` |
| Ikkilamchi matn | `#4A465A` | `text-ink-2` |
| Izoh, vaqt, meta | `#736F82` | `text-ink-3` |
| Chegara | `#E6E4EC` | `border-line` |
| Input chegarasi | `#CFCCD8` | `border-line-2` |
| Pasiv chip/disabled | `#F1F0F4` | `bg-fill` |
| Xato | `#C9302A` | `text-danger` |

**Lime ISHLATILADI:** faqat asosiy tugma foni (`bg-lime text-ink`). Har ekranda
0 yoki 1 ta.

**Lime ISHLATILMAYDI:** matn rangi, chegara, ikonka, havola, Plate, chip,
tanlangan holat, fokus halqasi, "yangi" belgisi, fon aksenti. Hech qachon.
(Qog'ozda lime matn kontrasti ~1.3:1 — o'qilmaydi.)

### Ekran bo'yicha lime egasi

| Ekran | Lime egasi |
|---|---|
| Profil | "Kontaktni saqlash" (vCard) |
| Avtovizitka / teg | "Egasiga xabar yuborish" |
| Menyu | "Ofitsiantni chaqirish" (pastda yopishgan) |
| Hisob | "To'lash" |
| Xizmat narxlari | "Yozish" (Telegram) |

### Tipografiya (mobil 360px asos)

| Rol | Shrift | O'lcham/qator | Vazn | Tracking | Klass |
|---|---|---|---|---|---|
| Plate | Unbounded | 24/28 | 700 | 0.06em | `<Plate size="lg">` |
| Ism (h1) | Inter | 24/28 | 600 | -0.01em | `text-[24px] leading-7 font-semibold tracking-[-0.01em]` |
| Lavozim/kompaniya | Inter | 16/24 | 400 | 0 | `text-[16px] leading-6 text-ink-2` |
| Bo'lim sarlavhasi (h2) | Inter | 17/24 | 600 | 0 | `text-[17px] leading-6 font-semibold` |
| Matn | Inter | 16/24 | 400 | 0 | `text-[16px] leading-6` |
| Narx | Inter | 16/24 | 600 | 0 | `text-[16px] font-semibold num` |
| Izoh | Inter | 13/18 | 400 | 0 | `text-[13px] leading-[18px] text-ink-3` |
| Tugma | Inter | 16/24 | 600 | 0 | `text-[16px] font-semibold` |

16px dan kichik matn faqat izohda. Sabab: Android Chrome 16 dan kichik inputda
zoom qiladi, va 13px dan kichik matn quyoshda o'qilmaydi. **12px yo'q.**

Desktop (≥768): `max-w-[480px] mx-auto`, o'lchamlar o'zgarmaydi. Mehmon
sahifasi telefon sahifasi; katta ekranda o'rtada tor ustun.

### Bo'shliq va radius

- Sahifa gorizontal padding: 16px. Pastki: `pb-[calc(96px+env(safe-area-inset-bottom))]`.
- Bloklar orasi 24px. Kartochka ichi 16px. Ro'yxat qatori vertikal 12px.
- Radius: kartochka 16, input 12, tugma/chip 9999, Plate 8, rasm 12.
- **Soya yo'q.** Chegara 1px `line`. (Soya arzon Android'da banding beradi, va
  soya = "ilova"; chegara = "hujjat".)

### Komponentlar

```tsx
// ui/paper/Button.tsx
const base = "inline-flex items-center justify-center gap-2 h-[52px] px-5 rounded-full text-[16px] font-semibold select-none transition-[transform,background-color] duration-[120ms] ease-[var(--ease-out)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-fill disabled:text-ink-3 disabled:active:scale-100";

export const variants = {
  primary:   `${base} bg-lime text-ink active:bg-lime-press`,   // ekranda faqat bitta
  secondary: `${base} bg-white text-ink border border-line-2 active:bg-fill`,
  ghost:     `${base} bg-transparent text-ink-2 h-11 px-3`,
};
```

Balandlik 52 (barmoq + qo'lqop qish), to'liq kenglik. Ikonka 20px, chapda.
Fokus halqasi **ink**, lime emas. Primary tugma pastda yopishadi:

```tsx
<div className="fixed inset-x-0 bottom-0 bg-paper/95 backdrop-blur-[2px] border-t border-line px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
  <button className={variants.primary + " w-full"}>Kontaktni saqlash</button>
</div>
```

**Kartochka:** `bg-white border border-line rounded-card p-4`. Kartochka ichida
kartochka — taqiqlanadi. Ichkarida faqat ro'yxat qatorlari.

**Ro'yxat qatori:** min balandlik 56.
```tsx
<a className="flex items-center gap-3 min-h-[56px] py-3 -mx-4 px-4 border-b border-line last:border-b-0 active:bg-fill">
  <span className="w-6 h-6 shrink-0 text-ink-2">{icon}</span>
  <span className="flex-1 min-w-0">
    <span className="block text-[16px] leading-6 truncate">Telegram</span>
    <span className="block text-[13px] leading-[18px] text-ink-3 truncate">@username</span>
  </span>
  <span className="text-[16px] font-semibold num shrink-0">45 000 so'm</span>
</a>
```
Chevron faqat ichki sahifaga olib borsa; tashqi havolada 16px "↗" `text-ink-3`.

**Chip:** pasiv `bg-fill text-ink-2`, tanlangan `bg-ink text-paper`. h-8 px-3
rounded-full text-[13px] font-medium. Tanlangan = ink, **lime emas**.

**Input:** `h-[52px] px-4 rounded-input bg-white border border-line-2
text-[16px] focus:border-ink focus:outline-none placeholder:text-ink-3`.
Label tepada 13/18 `text-ink-2`. Xato: `border-danger` + pastda 13px matn.

### Profil sahifasi eskizi (yuqoridan pastga)

1. `h-14` shapka: chapda "FLEX" so'zi (Inter 600, 15px), o'ngda `<Plate size="sm">`. Sticky **emas**.
2. Avatar 88px doira (rasm bo'lmasa — ink doira, ichida bosh harflar Unbounded 600 32px paper).
3. Ism 24/28, ostida kompaniya 16/24 `ink-2`, ostida `<Plate size="lg">`.
4. Ikki qator tezkor tugma (secondary): "Qo'ng'iroq" / "Telegram".
5. Havolalar kartochkasi, Xizmatlar kartochkasi, Tavsiyalar.
6. Pastda: "Bu FLEX raqami · O'zingizga olish →" (13px `ink-3`). **Yagona reklama joyi.**
7. Yopishgan lime: "Kontaktni saqlash".

### Animatsiya

- Sahifa kirish animatsiyasi: **yo'q.** Server render, birinchi bo'yoq qanchalik tez bo'lsa shu.
- Tugma bosish: `scale 0.98`, 120ms.
- Nusxa olindi / saqlandi: tugma matni 200ms ichida "Saqlandi ✓" ga almashadi, 1.5s turadi, qaytadi. **Toast yo'q.**
- Kategoriya chiplar gorizontal skroll: `scroll-snap-type: x mandatory`, animatsiya yo'q.
- Skeleton: yo'q (SSR). Rasm: `loading="lazy"`, o'lcham oldindan berilgan (`aspect-square`), joy sakramaydi.

### Ishlash byudjeti (bu ham spetsifikatsiya)

- HTML + CSS ≤ 40KB gzip. Mijoz JS: faqat vCard yaratish va nusxa olish — ≤ 15KB.
- Shrift: Inter 400/600 + Unbounded 700, hammasi ≤ 90KB.
- Avatar: Supabase transform `?width=176&quality=75`.
- **Maqsad:** Moto G / 3G Fast emulyatsiyasida LCP ≤ 1.8s. CI da Lighthouse gate.

"Bir tegish, ilova o'rnatilmaydi" degan va'da agar sahifa 3G da 4 soniya
yuklansa buziladi. Maqsad: raqam va ism **1 soniyagacha** ko'rinadi.

---

## B. EGA — Siyoh yuz

**Kim:** egasi. Kuniga 5–20 marta, ko'pincha telefonda, ba'zan noutbukda.
Ma'lumot zich, qaror tez.

**Bosh qoida:** lime = "sen hozir nima qilishing kerak". Bir sahifada yoki
bitta lime hisoblagich, yoki bitta lime tugma. Ikkalasi birga — yo'q.

### Ranglar

| Rol | Hex | Klass |
|---|---|---|
| Fon | `#0E0A1B` | `bg-ink` |
| Kartochka | `#16122A` | `bg-ink-s1` |
| Hover / ko'tarilgan / input | `#1F1A36` | `bg-ink-s2` |
| Chegara | `#2B2644` | `border-ink-line` |
| Asosiy matn | `#FAFAF8` | `text-paper` |
| Ikkilamchi | `#B3AFC2` | `text-paper-2` |
| Izoh | `#7F7B92` | `text-paper-3` |
| Xavf (kechikkan, o'chirish) | `#FF6B5E` | `text-danger-ink` |
| Ogohlantirish | `#FFC24B` | `text-warn-ink` |

**Grain va nuqtali mesh — olib tashlanadi.** Ink yuzda tekstura o'rniga
chuqurlik s1 → s2 qavatlari bilan.

### Ekran bo'yicha lime egasi

| Sahifa | Lime egasi |
|---|---|
| Kabinet (bosh) | "Bugun: N ta ish" bloki |
| Kontaktlar navbati | Yo'q (ro'yxatning o'zi ish; KECHIKKAN — danger rangida) |
| Profil tahrirlash | "Saqlash" |
| Menyu tahrirlash | "Saqlash" / "Taom qo'shish" — bittasi, qaysi biri joriy bo'lsa |
| Mehmon so'rovlari | Eng yangi javobsiz qator foni |
| Buyurtmalar navbati | Keyingi bajarilishi kerak buyurtma |
| Statistika, hisobot, QR, stollar | Yo'q |
| Obuna | "To'lash" |

**Lime ISHLATILMAYDI:** grafik chiziqlar (grafik — `paper-2` chiziq), ikonka,
matn, aktiv tab, toggle "yoniq" holati (toggle = paper), havola.

### Tipografiya

| Rol | Shrift | O'lcham/qator | Vazn | Klass |
|---|---|---|---|---|
| Sahifa sarlavhasi | Inter | 20/24 | 600 | `text-[20px] leading-6 font-semibold tracking-[-0.01em]` |
| KPI raqam | Unbounded | 28/32 | 600 | `font-display text-[28px] leading-8 font-semibold num` |
| Bo'lim (h2) | Inter | 15/20 | 600 | `text-[15px] leading-5 font-semibold` |
| Matn, qator | Inter | 14/20 | 400 | `text-[14px] leading-5` |
| Kichik, meta | Inter | 12/16 | 400/500 | `text-[12px] leading-4 text-paper-3` |
| Jadval sarlavhasi | Inter | 12/16 | 500 | `uppercase tracking-[0.04em] text-paper-3` |
| Tugma | Inter | 14/20 | 600 | |

12px ruxsat — bu egasining ekrani, u yaqindan qaraydi va sahifani biladi.

### Bo'shliq va radius

- Sahifa padding: mobil 16, desktop 24. Maks kenglik **1120px**.
- Kartochka ichi 16, kartochkalar orasi 12, bo'limlar orasi 24.
- Radius: kartochka 12, input/tugma 8, chip 6, Plate 8.
- Soya yo'q. Qavat = fon rangi + 1px chegara.
- Desktop: chapda 240px navigatsiya (`bg-ink`, chegara o'ng), kontent o'ngda.
  Mobil: pastki tab bar 4 ta element `h-14` + safe-area.

### Komponentlar

```tsx
// ui/ink/Button.tsx
const base = "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-[14px] font-semibold transition-[background-color,transform] duration-[120ms] ease-[var(--ease-out)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper disabled:opacity-40";
export const variants = {
  primary:   `${base} bg-lime text-ink hover:bg-lime-press`,   // sahifada bitta
  secondary: `${base} bg-ink-s2 text-paper border border-ink-line hover:border-paper-3`,
  ghost:     `${base} text-paper-2 hover:bg-ink-s1 px-2`,
  danger:    `${base} bg-transparent text-danger-ink border border-danger-ink/40 hover:bg-danger-ink/10`,
};
```
Ikonka 16px. Yuklanish: matn o'rniga 16px spinner, kenglik o'zgarmaydi (`min-w` saqlanadi).

**"Bugun" bloki — kabinetdagi yagona lime:**
```tsx
<a href="/kabinet/bugun" className="block bg-lime text-ink rounded-xl p-4 active:bg-lime-press">
  <div className="font-display text-[28px] leading-8 font-semibold num">7</div>
  <div className="text-[14px] leading-5 font-semibold mt-1">ta ish kutmoqda</div>
  <div className="text-[12px] leading-4 mt-0.5 opacity-70">3 kechikkan · 2 bugun · 2 yangi tanishuv</div>
</a>
```
Agar 0 bo'lsa — blok lime **emas**: `bg-ink-s1`, matn "Bugun bo'sh. Yaxshi."
Lime faqat ish borida.

**Ro'yxat qatori (kontaktlar navbati):** balandlik 56 (mobil), desktopda
jadval 44. Guruh sarlavhasi (KECHIKKAN, BUGUN…) — `sticky top-0 bg-ink
text-[12px] uppercase tracking-[0.04em] text-paper-3 h-8 px-3 flex items-center`.

**Chip:**
```tsx
const tones = {
  neutral: "bg-ink-s2 text-paper-2",
  danger:  "bg-danger-ink/12 text-danger-ink",
  warn:    "bg-warn-ink/12 text-warn-ink",
  done:    "bg-ink-s2 text-paper-3 line-through",
};
// h-6 px-2 rounded-md text-[12px] font-medium whitespace-nowrap
```
Bosqichlar: yangi `neutral`, gaplashilyapti `neutral` (paper matn), mijoz
`neutral`, sovuq `done`. **Bosqich rangli emas** — rang faqat vaqt holati uchun
(kechikkan/bugun). *Bosqich — matn, holat — rang. Aralashtirmang.*

**Input:** `h-10 px-3 rounded-lg bg-ink-s2 border border-ink-line text-[14px]
text-paper placeholder:text-paper-3 focus:border-paper-2 focus:outline-none`.
Label 12/16 `paper-2` tepada, 6px bo'shliq.

**Jadval:** `text-[14px]`, qator `h-11`, chegara `border-ink-line`, raqam
ustunlari `text-right num`, birinchi ustun `sticky left-0 bg-ink`. Zebra yo'q.
Hover `bg-ink-s1`.

**Grafik:** chiziq/ustun rangi `paper-2`, o'q matni 12px `paper-3`, to'r
`ink-line`. Bugungi ustun — `paper` (oq), lime emas. *Grafik hech qachon lime
emas: grafik "qara" deydi, lime "qil" deydi.*

### Animatsiya

- Sahifa almashish: yo'q.
- Ro'yxatga yangi element: `opacity 0→1`, `translateY 4→0`, 150ms.
- Drawer/sheet (mobil): pastdan 200ms `ease-out`, orqa fon `bg-ink/60`.
- Muvaffaqiyat: tugma 200ms "Saqlandi" ga aylanadi, 1.2s. Toast faqat sahifani tark etganda kerak bo'lsa (`bottom-20`, `bg-paper text-ink`, 3s).
- Hover: rang 120ms. **Hech narsa 240ms dan uzun emas.**

---

## C. DEVOR — Signal yuz

**Kim:** kassadagi telefon yoki planshet, tik turgan, doim yoniq, 1–2.5 m
masofa, kassir yon ko'z bilan qaraydi. Ba'zan mehmon ham ko'radi ("hisobingiz").
Ekran shovqinli joyda, yorug'lik o'zgaruvchan.

**Bosh qoida:** 2 metrdan o'qilmagan narsa — yo'q narsa. Hech qanday element
24px dan kichik emas. Bitta lime plitka = eng yangi javobsiz so'rov.

### Ranglar

Siyoh yuz palitrasi (B) + qoidalar:

- Fon `#0E0A1B`, plitka `#16122A`, chegara `#2B2644`.
- Matn `#FAFAF8` va `#B3AFC2` — **`paper-3` (`#7F7B92`) taqiqlanadi**: uzoqdan ko'rinmaydi.
- Lime plitka: `bg-lime text-ink`.
- 60 s javob berilmagan so'rov: plitkaning chap tomonida 8px `bg-danger-ink`
  chiziq (lime saqlanadi, chunki hali ham "eng yangi" bo'lishi mumkin; agar u
  eng yangi bo'lmasa — s1 fon + qizil chiziq).
- Ekran doim yoniq: `navigator.wakeLock`.
- **OLED kuyishiga qarshi:** hech qanday element 10 daqiqadan ortiq bir joyda
  o'zgarmay turmaydi — bo'sh holatda soat plitkasi har 5 daqiqada 8px siljiydi.

### Tipografiya

| Rol | Shrift | Telefon | Planshet | Vazn |
|---|---|---|---|---|
| Stol raqami | Unbounded | 72/72 | 112/112 | 700 |
| So'rov turi ("Suv", "Hisob", "Ofitsiant") | Inter | 32/36 | 48/52 | 600 |
| Vaqt ("2 daq") | Inter | 24/28 | 32/36 | 500 |
| Ikkinchi darajali qator | Inter | 28/32 | 36/40 | 600 |
| Bo'sh holat matni | Inter | 28/32 | 40/44 | 500 |
| Summa (kassa) | Unbounded | 56/56 | 88/88 | 700 |

Hammasi `num`. Tracking sarlavhada -0.02em. **Minimum: 24px.**

### Bo'shliq va radius

Ekran padding 16 (telefon) / 24 (planshet). Plitkalar orasi 12. Radius plitka
24, ichki padding 24. **Tugma balandligi 80** (kassir qaramasdan bosadi).

### So'rov plitkasi

```tsx
function RequestTile({ table, kind, ago, newest, overdue }: Props) {
  return (
    <div className={[
      "relative rounded-tile p-6 flex items-center gap-6 min-h-[136px]",
      newest ? "bg-lime text-ink" : "bg-ink-s1 text-paper border border-ink-line",
    ].join(" ")}>
      {overdue && <span className="absolute left-0 top-6 bottom-6 w-2 rounded-r bg-danger-ink" />}
      <div className="font-display text-[72px] leading-none font-bold num w-[120px] text-center">{table}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[32px] leading-9 font-semibold tracking-[-0.02em] truncate">{kind}</div>
        <div className={`text-[24px] leading-7 font-medium num mt-1 ${newest ? "opacity-70" : "text-paper-2"}`}>{ago}</div>
      </div>
    </div>
  );
}
```

Plitkaga tegish = "qabul qildim". Tegilganda plitka 200ms ichida s1ga tushadi,
navbatdagi eng yangi lime bo'ladi. **Bir vaqtning o'zida faqat bitta lime.**

Ro'yxat: yuqorida eng yangi javobsiz (lime), keyin javobsizlar eski→yangi
tartibda (eng eskisi tepa — ochlik qoidasi), pastda 5 daqiqagacha "qabul
qilingan"lar 50% shaffof `text-paper-2`. Ekranda maksimal 5 plitka; ortig'i —
pastki qatorda "+3".

### Bo'sh holat

```tsx
<div className="h-dvh flex flex-col items-center justify-center gap-4 text-paper">
  <Plate n="CAF012" size="xl" />
  <div className="text-[28px] leading-8 font-medium text-paper-2">So'rov yo'q</div>
  <div className="font-display text-[56px] leading-none font-bold num">14:32</div>
</div>
```
Lime yo'q. Sovuq, tinch.

### Kassa ekrani (mehmonga qaragan)

Yuqorida Plate (obyekt raqami) 32px. O'rtada buyurtma qatorlari 28/32 (nomi
chapda, summa o'ngda `num`). Pastda JAMI — Unbounded 56, keyin to'lov usullari
3 ta katta plitka `h-20` (Naqd / Karta / QR).

Lime — "JAMI" bloki emas: mehmon ekranida harakat qiladigan mehmon emas,
kassir. Lime — kassir bosishi kerak bo'lgan bitta tugma: **"Chek chiqarish"**
(agar to'lov tasdiqlangan bo'lsa). To'lov tasdiqlanmaguncha lime yo'q.

**Tugma (kassir):** `h-20 rounded-tile text-[28px] font-semibold` —
`bg-ink-s2 text-paper border border-ink-line`. Primary: `bg-lime text-ink`.
Bosish: `scale 0.97`, 120ms + 30ms `navigator.vibrate`.

### Animatsiya va signal

- Yangi so'rov: plitka yuqoridan `translateY(-16px) → 0`, opacity, 240ms.
  Keyin 3 marta `outline 4px lime` puls (600ms har biri), keyin to'xtaydi.
  **Cheksiz miltillash — taqiq:** kassir ko'r bo'lib qoladi.
- Ovoz: 1 ta qisqa signal (WAV, 200ms, ~880Hz). Ovoz sozlamasi obyekt
  kabinetida. 60 s dan keyin javob bo'lmasa — bitta qayta signal, boshqa yo'q.
- Realtime: Supabase channel `requests:obj_id`. Ulanish uzilsa yuqorida `h-8
  bg-warn-ink text-ink text-[20px]` chiziq: "Aloqa yo'q — qayta ulanmoqda".
  Bu lime qoidasini buzmaydi (warn rang).
- Ekran hech qachon "yuklanmoqda" holatida qolmaydi: birinchi render — bo'sh
  holat, keyin ma'lumot keladi.

---

## D. Bosh sahifa — flex.com.uz

### Nega hozirgisi ishlamaydi

Qora sotuvchi sahifa "biz texnologiyamiz" deydi. O'zbekistonda NFC vizitka
sotib oladigan odam texnologiya sotib olmayapti — u "bu ishlaydimi, aldamaydimi,
ertaga bu kompaniya bo'ladimi" deb so'rayapti. Ishonch qora fondan emas,
**ko'rsatishdan** keladi: haqiqiy odam, haqiqiy joy, haqiqiy narx, haqiqiy
manzil, va sotib olishdan oldin sinab ko'rish imkoni.

Sahifa **Qog'oz yuz (A tizimi)** qoidalarida, desktop kengaytmalari bilan.

### Rasm qoidalari (butun sahifa uchun)

- 3D render, illyustratsiya, stok — **yo'q**. Faqat fotosurat.
- Hamma fon `#FAFAF8` — obyektlar sahifa fonida "yotadi", ramkali rasm yo'q.
- Odamlar: haqiqiy Toshkent, haqiqiy qo'llar — ayol va erkak, yosh va 50+,
  qora paltoli va oq xalatli. Kamida bitta kadrda Redmi/Samsung, faqat iPhone emas.
- Ekran ichidagi tasvir — **haqiqiy mahsulot skrinshoti** (A yuz), mockup emas.
  Skrinshot va real UI bir xil bo'lishi kerak; farq bo'lsa ishonch ketadi.
- Filtr yo'q, "kinolik" rang yo'q. Kunduzgi yorug'lik.

### Tuzilma

Desktop konteyner 1120px, gorizontal padding 24. Mobil 16. Bloklar orasi
desktop 96px, mobil 64px.

**0. Navigatsiya** — `h-16`, sticky, `bg-paper/95 border-b border-line`

Chapda: "FLEX" (Inter 600, 18px) — logotip so'zning o'zi, plate raqam uchun.
O'rtada (desktop): Shaxsiy · Biznes · Obyekt · Narxlar · Savollar.
O'ngda: `+998 71 ··· ·· ··` (telefon raqami ko'rinadi — bu O'zbekistonda
ishonch belgisi) va tugma "Raqam olish".

*Lime qoidasi:* hero ko'rinib turganda nav tugmasi secondary (oq, chegarali).
Hero skroll qilib o'tilgach — `bg-lime` ga aylanadi (IntersectionObserver).
Bitta viewportda bitta lime.

**1. Hero** — `pt-16 pb-24`, desktop 2 ustun 7/5

Chap (matn):
- Yuqorida kichik qator 13px `ink-3`: "Toshkent · 2025 yildan"
- Sarlavha, Unbounded 700, desktop 56/60, mobil 36/40, tracking -0.02em:
  **"Telefonni tegizing. Tanishuv tugadi."**
- Ostida Inter 400, 20/28, `ink-2`, maks 44 belgi/qator:
  "FLEX — umrbod raqamingiz. Karta, uzuk yoki braslet. Tegilgan telefon
  profilingizni ochadi. Ilova o'rnatilmaydi — na sizda, na unda."
- `<Plate n="AAA000" size="lg">` — yonida 13px `ink-3`: "shunday raqam sizniki bo'ladi"
- Tugmalar (qator, mobil ustun): primary **"Raqam olish — 149 000 so'mdan"**
  (narx tugmada — yashirilmaydi), secondary "40 soniyada ko'ring ▶".
- Pastda 13px `ink-3`, 3 punkt nuqta bilan: "Toshkentda ertaga yetkazamiz ·
  Payme / Click / Uzum · NFC yo'q bo'lsa QR bor"

O'ng (video): 6 soniyalik loop, ovozsiz, `aspect-[4/5]`, radius 16. Kadr: kafe
stoli (Toshkent, kunduz), bir qo'l boshqa odamga qora kartani uzatadi, u
telefonning orqasiga tegizadi, ekranda 1 soniya ichida A-yuz profil ochiladi
(haqiqiy UI), barmoq lime tugmani bosadi, "Saqlandi". Kamera tepadan, telefon
ekrani o'qiladigan darajada yaqin. Poster rasm — o'sha kadrning tegish lahzasi.

**2. Sinab ko'rish** — `py-16`, `bg-white border-y border-line`

*Bu blok ishonch uchun eng muhimi.* Sarlavha Inter 600 28/32: **"Sotib
olishdan oldin sinab ko'ring"**.

Desktop: chapda matn "Kameraingizni shu kodga tuting — hozir, shu yerda, hech
narsa o'rnatmasdan. Ochilgan sahifa — haqiqiy FLEX profili." O'ngda QR 200×200
(ink, paper fonda) + ostida `<Plate n="AAA001">`. Mobil: QR o'rniga tugma
"Namuna profilni ochish" (o'z telefonida QR skanerlab bo'lmaydi).

QR `flex.com.uz/AAA001` ga olib boradi — jonli namuna profil, A-yuz, "Bu
namuna" degan 13px yozuv tepada. Odam mahsulotni his qiladi.

**3. Qanday ishlaydi** — 3 ustun, `py-24`

Har ustun: tepada haqiqiy skrinshot yoki foto (`aspect-[4/3]`, radius 12),
Unbounded 600 raqam "1/2/3" 20px `ink-3`, sarlavha Inter 600 20/24, matn 16/24
`ink-2`.

1. **Raqam tanlaysiz** — "Tasodifiy yoki o'zingiz yoqtirgan. Raqam umrbod
   sizniki — karta yo'qolsa, yangisiga o'sha raqam yoziladi." *(Skrinshot: raqam tanlash ekrani)*
2. **Buyum tanlaysiz** — "Karta, uzuk, braslet, avtovizitka, hayvon tegi.
   Bittasini yoki bir nechtasini — hammasi bitta raqam." *(Foto: 5 buyum bir qatorda)*
3. **Tegizasiz** — "Odam telefonini tegizadi, profilingiz ochiladi. Kontaktni
   bir bosishda saqlaydi. Siz esa u haqida yozuv olasiz — kim, qachon, qayerda."
   *(Foto: tegish lahzasi, boshqa rakurs)*

**4. Buyumlar** — grid 3×2 (mobil 2×3), `py-24`

Sarlavha: **"Bitta raqam, oltita shakl"**. Har kartochka `bg-white border
border-line rounded-card p-4`: foto `aspect-square` (buyum paper fonda, yaqin
plan, yuzasida Plate gravirovkasi ko'rinadi), nom Inter 600 17px, bir qator
izoh 13px `ink-3`, narx 16px 600 `num`.

| Buyum | Izoh | Narx |
|---|---|---|
| Karta | PVC yoki metall | 149 000 so'm |
| Uzuk | Keramika, suvga chidamli | 249 000 so'm |
| Braslet | Silikon, bolalar o'lchami bor | 129 000 so'm |
| Avtovizitka | Oynaga, maxfiy xabar | 99 000 so'm |
| Hayvon tegi | Bo'yinbog'ga, egasiga xabar | 89 000 so'm |
| Stol qurilmasi | Kafe va restoran uchun | narx so'rov bo'yicha |

*(Narxlar sizniki bo'ladi — muhimi: ko'rinadi.)*

**5. Uch auditoriya** — `py-24`, `bg-ink text-paper`

Sahifadagi **yagona qora blok**. Kontrast uchun va "egasining tomoni"ni
ko'rsatish uchun — bu blokda B-yuz skrinshotlari turadi, demak qora fon
mantiqli. Blok radius 24 (konteyner ichida, chetgacha emas — "hujjat ichidagi
qora sahifa").

Tablar (Chip ink versiyasi, tanlangan = paper fon ink matn): Shaxs · Kompaniya · Kafe va do'kon.

Har tab: chapda 3 ta punkt (Inter 16/24, chap tomonda 20px ikonka `paper-2`),
o'ngda skrinshot (B-yuz kabinet, telefon ramkasiz, radius 12, chegara `ink-line`).

- **Shaxs:** "Havolalar, xizmatlar narxi, tavsiyalar bir sahifada" · "Kim qachon tegdi — statistika" · "Kontaktlar ro'yxati: ertalab kimga yozish kerakligini ko'rsatadi"
- **Kompaniya:** "Har xodimga raqam, dizayn bitta" · "Xodim ketsa — raqam kompaniyada qoladi" · "Hisob-faktura, bitta to'lov"
- **Kafe va do'kon:** "Har stolda QR va NFC — menyu uch tilda" · "Mehmon suv so'raydi — ofitsiantning Telegram'iga keladi" · "Oy oxirida bitta hisobot"

Bu blokda lime: **yo'q**. Tab pastida secondary (paper chegarali) tugma "Batafsil →".

**6. Kimlar ishlatadi** — `py-24`

Sarlavha: "Toshkentda allaqachon ishlayapti".

Mijozlar bor bo'lsa: 6 ta foto `aspect-[4/3]` — joyning kirish qismi yoki
stoli, FLEX stikeri ko'rinadi, ostida nom + tuman ("Bon Cafe · Yunusobod").
Logotip emas — **foto**. Logotipni hamma o'zi chizadi, fotoni yo'q.

Hali yo'q bo'lsa — **yolg'on logotip qo'ymang.** O'rniga: jonli hisoblagich
Supabase dan: Unbounded 700 56px `num` "1 284" + "ta raqam berildi" + ostida
oxirgi 5 ta berilgan raqam (`<Plate size="sm">`, ism yo'q, faqat raqam va
tuman). Haqiqiy son, haqiqiy vaqtda. *Kichik son ham ishonchli, katta yolg'on emas.*

**7. Ishonch qatori** — `py-16`, `bg-white border-y border-line`, 4 ustun

Sarlavha yo'q. Har ustun: 24px ikonka `ink-2`, Inter 600 16px, 14/20 `ink-2`.

- **NFC — yangi emas.** "Humo va Uzcard kartangizdagi kontaktsiz to'lov — o'sha texnologiya. Telefonlar 2018 yildan beri o'qiydi."
- **Telefonda NFC yo'qmi?** "Har buyumda QR ham bor. Kamera bilan ochiladi."
- **Karta yo'qolsa?** "Raqam sizda qoladi. Yangi karta — 49 000 so'm, o'sha raqam."
- **Ma'lumotlar qayerda?** "Serverlar O'zbekistonda. Profilni istalgan vaqt o'chirasiz."

**8. Narxlar** — `py-24`

Sarlavha: **"Narx — yashirin to'lovsiz"**. 3 ustun kartochka, o'rtadagisi
`border-ink` (chegara qalinroq, lime emas).

| | Shaxs | Kompaniya | Obyekt |
|---|---|---|---|
| Boshlang'ich | 149 000 so'm, buyum bilan | 129 000 so'm / xodim | Stollar soniga qarab |
| Obuna | 1-yil kiradi, keyin 19 000 so'm/oy | 15 000 so'm/oy/xodim | 199 000 so'm/oy |
| Obuna tugasa | Profil ochilaveradi, tahrir yopiladi | — | Menyu ochilaveradi, so'rovlar to'xtaydi |

**"Obuna tugasa nima bo'ladi" qatori — majburiy.** Bu savolni hamma ichida
so'raydi; javob bermasangiz, "aldaydi" deb o'ylaydi.

Har ustun ostida tugma: faqat o'rtadagi (yoki eng ko'p sotiladigan) primary
lime, qolganlari secondary. Viewportda bitta lime.

**9. Savollar** — `py-24`, `max-w-[720px]`, accordion

Har savol `min-h-[56px]` qator, chegara `line`, ochilganda 16/24 `ink-2` javob.
Animatsiya: balandlik 200ms.

- Ilova o'rnatish kerakmi? — "Yo'q. Na sizga, na tegizgan odamga."
- iPhone'da ishlaydimi? — "iPhone 7 dan boshlab, hammasida. Android — 2018 yildan keyingi deyarli hammasi."
- Kartani kimdir tegizib olsa, nima ko'radi? — "Faqat siz ochiq qo'ygan narsalarni. Telefon raqamingizni yashirsangiz — ko'rinmaydi."
- Raqamni o'zgartira olamanmi? — "Raqam umrbod. Lekin uni boshqa odamga o'tkazish mumkin."
- Viloyatga yetkazasizmi? — "Ha, BTS orqali 2–3 kun. Toshkent shahri — ertaga."
- To'lov qanday? — "Payme, Click, Uzum. Yuridik shaxslar uchun hisob-faktura."
- Ishlamasa? — "14 kun ichida pulni qaytaramiz, savolsiz."

**10. Yakuniy chaqiruv** — `py-24`, `bg-white border-t border-line`, markazda

Unbounded 600 36/40: **"Raqamingizni tanlang"**. Ostida jonli input: Plate
uslubida katta maydon, 6 belgi kiritiladi, AAA000 maskasi, ostida real vaqtda
"Bo'sh ✓" yoki "Band" (13px). Tugma primary lime "Shu raqam bilan davom
etish".

*Bu sahifadagi eng kuchli konversiya nuqtasi: odam o'z raqamini ko'radi va u
"meniki" bo'lib qoladi.*

**11. Footer** — `py-12`, `border-t border-line`, 13px `ink-3`

4 ustun: Mahsulot · Biznes · Yordam · Kompaniya. Kompaniya ustunida
**majburiy**: to'liq yuridik nom ("FLEX TEXNOLOGIYA MChJ"), STIR, jismoniy
manzil (tuman, ko'cha, uy), telefon, Telegram `@flex_uz`, ish vaqti.

*O'zbekistonda saytning pastida manzil va STIR yo'q kompaniyadan onlayn to'lov
qilmaydilar.*

Pastki qator: "© 2025 FLEX · Ommaviy oferta · Maxfiylik". Til almashtirgich:
**O'z / Ру** (kirill sahifa ham bo'lishi kerak — auditoriyaning yarmi).

### Sahifadagi lime hisobi

Skroll bo'ylab: hero tugma → (nav tugma hero'dan keyin) → narxlar o'rtadagi
ustun → yakuniy tugma. Bir vaqtda ekranda hech qachon ikkitadan ko'p emas,
deyarli doim bitta. Boshqa hech qanday element — ikonka, sarlavha ostidagi
chiziq, hover — lime emas.

### Sahifa byudjeti

Hero video ≤ 1.2MB (AV1/H.265, 720p, poster WebP ≤ 60KB). Barcha fotolar
`next/image`, `sizes` to'g'ri, WebP. LCP — hero sarlavha **matni** (rasm emas),
≤ 1.5s 4G da. Mobil Lighthouse ≥ 90. Uchinchi tomon skriptlari: faqat
analitika (Yandex Metrika — mahalliy bozor uchun), hero yuklangandan keyin.

---

## E. Amalga oshirish tartibi

1. **Poydevor** — `globals.css` tokenlari, `fonts.ts` (Space Grotesk → Unbounded + Inter), `<Plate>`, `data-surface`. Grain/mesh olib tashlanadi.
2. **A yuz** — `/[handle]` profil, `/x/[token]` teg ekrani, menyu, hisob. `ui/paper/*`.
3. **B yuz** — kabinet va ichki ekranlar. `ui/ink/*`. Lime jadvali bo'yicha auditsiya.
4. **C yuz** — devor/kassa ekranlari. `ui/wall/*`.
5. **Bosh sahifa** — yuqoridagi 0–11 bloklar.

Har bosqichda tekshiriladigan narsa: **bitta ekranda nechta lime bor?** Javob
0 yoki 1 bo'lishi shart.
