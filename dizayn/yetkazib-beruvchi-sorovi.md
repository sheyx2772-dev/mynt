# Yetkazib beruvchilarga so'rov

Alibaba, Made-in-China yoki to'g'ridan-to'g'ri ishlab chiqaruvchiga yuboriladi.
Ingliz tilida — quyidagi matnni nusxalab yuboring.

Kamida **5–7 ta** yetkazib beruvchiga yuboring. Narxlar ikki barobar farq qiladi,
va faqat taqqoslash orqali haqiqiy bozor narxini bilasiz.

---

## Nima uchun aynan shu savollar

**Metall karta va NFC.** Metall radio to'lqinni to'sadi. Shuning uchun metall NFC
kartada yo maxsus kesma (slot), yo ferrit qatlam bo'lishi kerak. Buni so'ramasangiz,
karta chiroyli chiqadi va **ishlamaydi**. Bu eng ko'p uchraydigan xato.

**Kodlash.** Har bir kartada boshqa manzil bo'ladi —
`flex.com.uz/AAA000`, `flex.com.uz/BBB111`. Ikki yo'l bor: zavod ro'yxat bo'yicha
har birini alohida kodlaydi, yoki ular bo'sh keladi va biz o'zimiz kodlaymiz.
Ikkinchisi arzonroq va tezroq, lekin NFC kodlagich kerak (telefon ham bo'ladi,
lekin yuzta karta uchun uzoq).

**Qulflash.** Kodlangandan keyin teg **qayta yozishdan himoyalanishi** kerak.
Aks holda kim kartani qo'lga olsa, manzilni o'zgartirib yuborishi mumkin — mijoz
kartasi begona saytga olib boradi. Buni albatta so'rang.

**Namuna.** Buyurtmadan oldin namuna oling va **o'z telefoningizda sinab ko'ring**.
Rasmda hamma karta bir xil ko'rinadi.

---

## Yuboriladigan matn

```text
Hello,

We are a company in Uzbekistan launching a digital business card service. We are
looking for a long-term supplier of NFC products and would like a quotation.

WHAT WE NEED

1. NFC METAL CARD
   - Size: standard card, 85.6 x 54 mm, thickness 0.8 mm
   - Finish: matte black, and a second version in gold
   - Chip: NTAG215 or NTAG216
   - IMPORTANT: the card must work reliably on both Android and iPhone. Please
     confirm how you solve metal shielding — slot design, ferrite layer, or
     another method — and confirm the read distance you guarantee.
   - Printing: laser engraving of a logo and a short code on each card

2. NFC CERAMIC RING
   - Material: zirconia ceramic, black, polished
   - Chip: NTAG216
   - Sizes: please list the sizes you produce
   - Waterproof, and please state the read distance

3. NFC BRACELET
   - Two options please: silicone, and leather with a metal clasp
   - Chip: NTAG216
   - Colour: black with a thin green accent line

QUESTIONS

a) Unit price at 100, 500, 1000 and 5000 pieces, for each product
b) Minimum order quantity for each
c) Production lead time after artwork approval
d) Shipping cost and time to Tashkent, Uzbekistan
e) Can you encode each item with a unique URL from a list we provide? If yes,
   what is the extra cost per item? If no, we will encode ourselves.
f) Can the tags be locked after encoding so the data cannot be overwritten?
   This is required — we cannot ship a card whose destination a stranger can
   change.
g) Do you provide artwork templates with bleed and safe-area dimensions?
h) Sample cost and delivery time for one of each product
i) What warranty do you give against manufacturing defects?

We plan to start with a small order and scale. Please send your price list and
photographs of similar work you have done.

Thank you.
```

---

## Javoblar kelganda

Solishtirishda uchta narsaga qarang, narxdan tashqari:

1. **Metall to'siq masalasiga aniq javob berdimi.** "Yes it works" degan javob
   javob emas. Qanday hal qilgani va o'qish masofasi aytilishi kerak
2. **Qulflashni qila oladimi.** Yo'q desa, o'sha yetkazib beruvchini o'tkazib yuboring
3. **Namuna yuboradimi.** Namunasiz katta buyurtma bermang

Narxlar kelgach ayting — `src/lib/devices.ts` dagi raqamlarni haqiqiy tannarx
asosida qayta hisoblaymiz. Hozirgi 200 000 / 250 000 / 350 000 mo'ljal, xolos.
