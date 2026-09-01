# Yetkazib beruvchilarga so'rov

Ikkita matn: mahalliy firmalar uchun (rus tilida) va xorijiy uchun (ingliz tilida).
Mahalliydan boshlang — bojxona yo'q, namunani bir kunda ko'rasiz, borib gaplashish mumkin.

## Mahalliy firmalarni qayerdan topasiz

**2GIS** — Toshkentda "Изготовление пластиковых карт" bo'yicha qidiring. Telefon
raqamlari, manzillari va sharhlari bilan ro'yxat chiqadi:
[2gis.uz](https://2gis.uz/tashkent/search/%D0%98%D0%B7%D0%B3%D0%BE%D1%82%D0%BE%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%BF%D0%BB%D0%B0%D1%81%D1%82%D0%B8%D0%BA%D0%BE%D0%B2%D1%8B%D1%85%20%D0%BA%D0%B0%D1%80%D1%82)

Golden Pages'da ham bo'limi bor.

---

## Eng muhim texnik shart — chipni adashtirmang

Mahalliy firmalar odatda **Mifare** va **EM-Marine** kartalar chiqaradi. Bular
propusk va eshik ochish uchun. **Telefon ularni o'qib manzil ocholmaydi.**

Bizga kerak bo'lgani — **NTAG213, NTAG215 yoki NTAG216**, va ma'lumot **NDEF**
formatida yozilgan bo'lishi kerak. Faqat shunda iPhone ham, Android ham
tegizilganda saytni ochadi.

So'rovda birinchi savol shu bo'lsin. "Ha, NFC bor" degan javob yetarli emas —
chip nomini aniq aytishi kerak.

---

## Mahalliy firmalarga (rus tilida)

```text
Здравствуйте!

Мы — компания в Ташкенте, запускаем сервис цифровых визиток. Ищем поставщика
NFC-изделий для долгосрочного сотрудничества. Просим прислать коммерческое
предложение.

САМЫЙ ВАЖНЫЙ ВОПРОС

Нам нужны NFC-метки стандарта NTAG213, NTAG215 или NTAG216, записанные в
формате NDEF — чтобы при поднесении телефона (и Android, и iPhone) сразу
открывалась ссылка.

Mifare Classic и EM-Marine нам НЕ подходят: телефон не открывает по ним ссылку.

Пожалуйста, подтвердите, работаете ли вы с NTAG. Если нет — подскажите, кто
работает.

ЧТО НУЖНО

1. NFC-КАРТА
   - Размер стандартный, 85,6 x 54 мм
   - Два варианта: пластик (матовый чёрный) и металл (матовый чёрный и золотой)
   - Чип: NTAG215 или NTAG216
   - Печать или лазерная гравировка логотипа и короткого кода на каждой карте
   - Для металлической карты: как вы решаете экранирование металла? Металл
     блокирует NFC, нужен вырез или ферритовый слой. Укажите гарантированное
     расстояние считывания.

2. NFC-БРАСЛЕТ
   - Силиконовый и кожаный с металлической застёжкой
   - Чип: NTAG216
   - Чёрный, с тонкой зелёной линией

3. NFC-КОЛЬЦО (если делаете)
   - Керамика, чёрное
   - Чип: NTAG216
   - Какие размеры производите?

ВОПРОСЫ

а) Цена за штуку при 100, 500, 1000 и 5000 штук — по каждому изделию
б) Минимальный заказ
в) Срок изготовления после утверждения макета
г) Можете ли записать на каждое изделие свой уникальный адрес по нашему списку?
   Если да — сколько это стоит дополнительно? Если нет — мы запишем сами.
д) Можно ли заблокировать метку после записи, чтобы данные нельзя было
   перезаписать? Это обязательное условие: мы не можем продать карту, адрес
   на которой посторонний человек сможет поменять.
е) Даёте ли шаблон макета с вылетами и безопасной зоной?
ж) Стоимость и срок изготовления образца — по одному изделию каждого вида
з) Какая гарантия на производственный брак?

Начнём с небольшого заказа, дальше объёмы вырастут. Пришлите, пожалуйста,
прайс и фотографии похожих работ.

С уважением,
MC LEGAL
```

---

## Xorijiy firmalarga (ingliz tilida)

Alibaba yoki Made-in-China uchun. Mahalliylar uzuk va metall karta qila olmasa,
shu matn kerak bo'ladi.

```text
Hello,

We are a company in Uzbekistan launching a digital business card service. We are
looking for a long-term supplier of NFC products and would like a quotation.

WHAT WE NEED

1. NFC METAL CARD
   - Size: standard card, 85.6 x 54 mm, thickness 0.8 mm
   - Finish: matte black, and a second version in gold
   - Chip: NTAG215 or NTAG216, encoded as NDEF
   - IMPORTANT: the card must work reliably on both Android and iPhone. Please
     confirm how you solve metal shielding — slot design, ferrite layer, or
     another method — and confirm the read distance you guarantee.
   - Laser engraving of a logo and a short code on each card

2. NFC CERAMIC RING
   - Material: zirconia ceramic, black, polished
   - Chip: NTAG216
   - Sizes: please list the sizes you produce
   - Waterproof, and please state the read distance

3. NFC BRACELET
   - Two options: silicone, and leather with a metal clasp
   - Chip: NTAG216
   - Black with a thin green accent line

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

Thank you.
```

---

## Javoblarni qanday solishtirasiz

Narxdan tashqari uchta narsa hal qiladi:

**1. Chip nomini aniq aytdimi.** "NFC bor" — javob emas. NTAG213/215/216 dan
biri bo'lishi kerak. Mifare desa, mahsulot ishlamaydi.

**2. Metall to'siq masalasini qanday hal qilgani.** Faqat metall karta uchun.
"Ishlaydi" degan javob yetarli emas — usulini va o'qish masofasini aytsin.

**3. Qulflay oladimi.** Yo'q desa, o'sha firmani o'tkazib yuboring. Qulflanmagan
kartani begona odam qayta yozib, boshqa saytga yo'naltirib yuborishi mumkin.

**Namunasiz katta buyurtma bermang.** O'z telefoningizda sinab ko'ring — iPhone'da
ham, Android'da ham. Rasmda hamma karta bir xil ko'rinadi.

Narxlar kelgach ayting: `src/lib/devices.ts` dagi raqamlar hozir mo'ljal, haqiqiy
tannarx asosida qayta hisoblaymiz.
