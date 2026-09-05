# Figma uchun tuzatish promti

Quyidagini Figma'ga (Figma Make / AI / dizaynerga) **to'liq** ko'chiring.
Har bir band ekrandagi aniq nuqson — "chiroyliroq qil" degan gap yo'q.

---

## Kontekst

flex.com.uz — O'zbekiston uchun NFC vizitka platformasi. Ikkita ekran bor:
**katalog** (profillar ro'yxati) va **profil kartasi**. Til: o'zbek, RU almashtirgich bilan.
Maket iPhone 15/16 Pro (393×852pt) uchun, lekin 360pt dan 430pt gacha cho'zilishi kerak.

---

## A. Katalog ekrani — tuzatilsin

1. **Sarlavha Dynamic Island ostida qolgan.** "UZ/RU" almashtirgich butunlay
   ko'rinmayapti. Yuqoridan **59pt safe-area** qo'shing. Til almashtirgichni
   o'ng tomonga, island'dan pastga tushiring.

2. **"13 PROFIL / 5 SOHA" juda katta** (~34px) va ekranning birinchi 150px'ini
   egallaydi. Bu kontent emas, sanoq. **14px, bitta qatorda**, filtrlar yoniga.

3. **Filtr chiplari 3 qatorga yoyilgan** — yana ~230px ketyapti. Bitta
   **gorizontal scroll qatoriga** yig'ing (balandlik 44pt, gap 8pt, chetdan 16pt
   padding, o'ng chetda kesilgan chip ko'rinsin — scroll borligi bilinsin).

4. **Emoji ikonka sifatida ishlatilgan** (📁 🏛 ⚖️ 🏦 🚀 🏢). Emoji har qurilmada
   boshqacha chiziladi va brendga tegishli emas. **Bitta monoline ikonka
   to'plamiga** almashtiring (16px, 1.5px stroke) yoki umuman olib tashlang —
   chiplar matnsiz ham tushunarli.

5. **Telefon ichida telefon.** Foydalanuvchi allaqachon telefon ushlab turibdi.
   Ichki qurilma ramkasi, soxta "9:41" status bar, soxta notch — **hammasini
   olib tashlang**. Profil kartasi to'g'ridan-to'g'ri ko'rinsin, kenglikning
   80px'i ramkaga ketmasin.

6. **"DAVLAT ORGANI" nishoni va "Toshkent" belgisi kesilgan** — soxta notch
   ostida qolgan. Ramka olingandan keyin ular kartaning yuqori qatoriga
   16pt chetdan joylashsin.

7. **Karta pastdan kesilgan**, hech qanday belgi yo'q. Yo to'liq ko'rsating,
   yo pastki 48px'ga **fade** qo'ying — davomi borligi bilinsin.

8. **"Prezident Adm." tugmasi ramka chetidan chiqib ketgan.** Hech bir element
   o'z konteynerining chegarasini kesib o'tmasligi kerak.

9. **Matn ikki marta takrorlanyapti.** Ism va lavozim karta ichida ham, undan
   pastda ham bor. Pastdagisini olib tashlang.

10. **"...Boshlig'i Ma…" so'z o'rtasidan kesilgan.** Ellipsis qo'yish o'rniga
    2 qatorga ruxsat bering (`line-clamp: 2`).

---

## B. Profil kartasi — tuzatilsin

11. **Ikki ko'k rang orasida qattiq chok bor.** Lenta pastida ko'rinadigan
    chiziq. Yo bitta rang, yo ataylab qilingan ajratgich (1px, 12% oq), yo
    haqiqiy gradient — hozirgisi tasodifiy xatoga o'xshaydi.

12. **Gerb deyarli ko'rinmayapti** (kontrast juda past). Va **huquqiy masala**:
    bu O'zbekiston Respublikasining Davlat gerbi — uni tijorat mahsulotida
    ko'rsatish qonun bilan cheklangan. Demo profil uchun **o'ylab topilgan
    tashkilot** ishlating (masalan "Toshkent Innovatsiya Markazi"), haqiqiy
    davlat organi emas.

13. **Uch qatorda uch xil shrift.** Ism — serif, tashkilot — qalin sans (oltin),
    lavozim — oddiy sans. Tashkilot nomi ismdan og'irroq ko'rinyapti, ya'ni
    ierarxiya teskari. Qiling: ism 24px/600, tashkilot 13px/600 oltin,
    lavozim 12px/400. **Bitta oila** (yoki ism uchun serif — lekin faqat ism).

14. **"Erkak · 48 yosh" nishonini olib tashlang.** Jins va yosh vizitkada
    kerak emas va bu shaxsiy ma'lumot. "Tasdiqlangan" nishoni qolsin.

15. **Setkada ikki xil uslub.** Birinchi qator — oltin monoxrom, ikkinchi qator —
    brend ranglari. Bitta setkada ikki tizim. Tanlang: **yo hammasi brend
    rangida** (ilova ikonkasidek), **yo hammasi oltin monoxrom**. Radius
    hamma katakda bir xil — 22% (56px katak uchun 12px).

16. **Yorliqlar ingliz tilida** — "Email, Call, Calendar, Connect",
    "ADD TO CONTACTS", "SHARE". Mahsulot o'zbekcha. Qiling:
    Email · Qo'ng'iroq · Uchrashuv · Havola · KONTAKTGA QO'SHISH · ULASHISH.
    RU varianti ham chizilsin, chunki almashtirgich bor.

17. **"Youtube" → "YouTube".**

18. **Lavozim matni past kontrastda** (och-ko'k, to'q ko'k ustida). WCAG AA
    uchun 4.5:1 kerak. Rangni oqartiring yoki 13px'ga kattalashtiring.

19. **Bosilgan va fokus holatlari chizilmagan.** Har bir tugma va katak uchun
    default / hover / pressed / focus varianti kerak.

20. **Yorug' mavzu yo'q.** Faqat to'q ko'k bor. Ikkala mavzu ham chizilsin.

---

## C. Kod uchun talab

Rang, o'lcham va oraliqlarni **Figma Variables** qilib bering (qo'lda qo'yilgan
hex emas). Har bir ikonka va logo alohida komponent bo'lsin — SVG qilib
eksport qilamiz. Freymlarga **auto-layout** qo'ying, absolute joylashuv emas:
absolute maket faqat 393px'da ishlaydi, bizga 360–430px kerak.
