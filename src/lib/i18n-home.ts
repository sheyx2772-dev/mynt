import type { Lang } from "./i18n";

// The front page, in the three languages it is actually read in.
//
// Kept out of i18n.ts, which is already two thousand lines, and kept whole
// rather than assembled from shared fragments: this page argues a case, and a
// sentence borrowed from a pricing table does not argue anything.
//
// The Russian column is not optional. Roughly half of this audience reads
// Cyrillic, and a person deciding whether to trust a company with a card
// payment decides it in the language they think in.

const HOME = {
  uz: {
    // -- nav --------------------------------------------------------------
    navPersonal: "Shaxsiy",
    navBusiness: "Biznes",
    navVenue: "Obyekt",
    navPrices: "Narxlar",
    navFaq: "Savollar",
    navCta: "Raqam olish",

    // -- 1. hero ----------------------------------------------------------
    heroEyebrow: "Toshkent · 2025 yildan",
    heroTitle: "Telefonni tegizing. Tanishuv tugadi.",
    heroLead:
      "FLEX — umrbod raqamingiz. Karta, uzuk yoki braslet. Tegilgan telefon profilingizni ochadi. Ilova o'rnatilmaydi — na sizda, na unda.",
    heroPlateNote: "shunday raqam sizniki bo'ladi",
    heroPrimary: "Raqam olish",
    heroSecondary: "Ishlayotganini ko'rish",
    heroFacts: [
      "Toshkentda ertaga yetkazamiz",
      "Payme · Click · Uzum",
      "NFC yo'q bo'lsa QR bor",
    ],
    heroPhotoAlt: "Kartani telefonga tegizish lahzasi",

    // -- 2. try it --------------------------------------------------------
    tryTitle: "Sotib olishdan oldin sinab ko'ring",
    tryLead:
      "Kameraingizni shu kodga tuting — hozir, shu yerda, hech narsa o'rnatmasdan. Ochilgan sahifa — haqiqiy FLEX profili, namuna rasm emas.",
    tryButton: "Namuna profilni ochish",
    tryCaption: "namuna raqam",

    // -- 3. how it works --------------------------------------------------
    howTitle: "Uch qadam",
    howSteps: [
      {
        title: "Raqam tanlaysiz",
        body:
          "Tasodifiy yoki o'zingiz yoqtirgan. Raqam umrbod sizniki — karta yo'qolsa, yangisiga o'sha raqam yoziladi.",
        photo: "/mahsulot/karta.jpg",
        alt: "FLEX kartasi, raqami bilan",
      },
      {
        title: "Buyum tanlaysiz",
        body:
          "Karta, uzuk, braslet, avtovizitka, hayvon tegi. Bittasini yoki bir nechtasini — hammasi bitta raqam.",
        photo: "/mahsulot/qurilmalar.jpg",
        alt: "FLEX qurilmalari bir qatorda",
      },
      {
        title: "Tegizasiz",
        body:
          "Odam telefonini tegizadi, profilingiz ochiladi. Kontaktni bir bosishda saqlaydi. Siz esa u haqida yozuv olasiz — kim, qachon, qayerda.",
        photo: "/mahsulot/skan.jpg",
        alt: "Telefon FLEX qurilmasini o'qiyapti",
      },
    ],

    // -- 4. devices -------------------------------------------------------
    devicesTitle: "Bitta raqam, bir necha shakl",
    devicesAll: "Hammasini ko'rish",
    priceOnRequest: "narx so'rov bo'yicha",

    // -- 5. three audiences ----------------------------------------------
    audienceTitle: "Kim uchun",
    audienceMore: "Batafsil",
    audiences: [
      {
        name: "Shaxs",
        points: [
          "Havolalar, xizmatlar narxi, tavsiyalar — bitta sahifada",
          "Kim qachon tegdi — statistika",
          "Kontaktlar ro'yxati: ertalab kimga yozish kerakligini ko'rsatadi",
        ],
        href: "/shaxsiy",
      },
      {
        name: "Kompaniya",
        points: [
          "Har xodimga raqam, dizayn bitta",
          "Xodim ketsa — raqam kompaniyada qoladi",
          "Hisob-faktura, bitta to'lov",
        ],
        href: "/biznes#jamoa",
      },
      {
        name: "Kafe va do'kon",
        points: [
          "Har stolda QR va NFC — menyu uch tilda",
          "Mehmon suv so'raydi — ofitsiantning Telegram'iga keladi",
          "Oy oxirida bitta hisobot",
        ],
        href: "/biznes",
      },
    ],

    // -- 6. traction ------------------------------------------------------
    tractionTitle: "Hozirgacha",
    tractionUnit: "ta raqam berildi",
    tractionLatest: "Oxirgi berilganlar",
    tractionLeft: "bo'sh raqam qoldi",

    // -- 7. trust ---------------------------------------------------------
    trust: [
      {
        q: "NFC — yangi emas",
        a: "Humo va Uzcard kartangizdagi kontaktsiz to'lov — o'sha texnologiya. Telefonlar 2018 yildan beri o'qiydi.",
      },
      {
        q: "Telefonda NFC yo'qmi?",
        a: "Har buyumda QR ham bor. Kamera bilan ochiladi.",
      },
      {
        q: "Karta yo'qolsa?",
        a: "Raqam sizda qoladi. Yangi karta buyurtma qilasiz — o'sha raqam bilan.",
      },
      {
        q: "Ma'lumotlar qayerda?",
        a: "Profilni istalgan vaqt o'chirasiz. Telefon raqamingizni yopiq qo'ysangiz — hech kim ko'rmaydi.",
      },
    ],

    // -- 8. prices --------------------------------------------------------
    pricesTitle: "Narx — yashirin to'lovsiz",
    pricesStart: "Boshlang'ich",
    pricesSub: "Obuna",
    pricesAfter: "Obuna tugasa",
    pricesFree: "Bepul",
    perMonth: "oyiga",
    perSeat: "xodimga",
    pricesCta: "Tanlash",

    // -- 9. faq -----------------------------------------------------------
    faqTitle: "Savollar",
    faqs: [
      {
        q: "Ilova o'rnatish kerakmi?",
        a: "Yo'q. Na sizga, na tegizgan odamga. Hammasi brauzerda ochiladi.",
      },
      {
        q: "iPhone'da ishlaydimi?",
        a: "iPhone 7 dan boshlab hammasida. Android — 2018 yildan keyingi deyarli hammasi. Eskiroq telefonlar uchun har buyumda QR bor.",
      },
      {
        q: "Kartani kimdir tegizib olsa, nima ko'radi?",
        a: "Faqat siz ochiq qo'ygan narsalarni. Telefon raqamingizni yashirsangiz — ko'rinmaydi.",
      },
      {
        q: "Raqamni o'zgartira olamanmi?",
        a: "Raqam umrbod sizniki. Lekin uni boshqa odamga o'tkazish mumkin — kabinetdan.",
      },
      {
        q: "Viloyatga yetkazasizmi?",
        a: "Ha. Toshkent shahri — ertaga, viloyatlar — 2–3 kun.",
      },
      {
        q: "To'lov qanday?",
        a: "Payme, Click, Uzum. Yuridik shaxslar uchun hisob-faktura.",
      },
    ],

    // -- 10. final --------------------------------------------------------
    finalTitle: "Raqamingizni tanlang",
    finalLetters: "Uchta harf",
    finalDigits: "Uchta raqam",
    finalSubmit: "Shu raqam bilan davom etish",
    finalError: "Uchta harf va uchta raqam kerak — masalan ABC123",
    finalHint: "Bo'shligini va narxini keyingi sahifada ko'rasiz",

    // -- 11. footer -------------------------------------------------------
    footProduct: "Mahsulot",
    footBusiness: "Biznes",
    footHelp: "Yordam",
    footCompany: "Kompaniya",
    footHours: "Dushanba–shanba, 10:00–19:00",
    footOffer: "Ommaviy oferta",
    footInn: "STIR",
  },

  ru: {
    navPersonal: "Личное",
    navBusiness: "Бизнес",
    navVenue: "Заведение",
    navPrices: "Цены",
    navFaq: "Вопросы",
    navCta: "Получить номер",

    heroEyebrow: "Ташкент · с 2025 года",
    heroTitle: "Приложите телефон. Знакомство состоялось.",
    heroLead:
      "FLEX — ваш номер навсегда. Карта, кольцо или браслет. Телефон, которым коснулись, открывает ваш профиль. Приложение не нужно — ни вам, ни ему.",
    heroPlateNote: "такой номер станет вашим",
    heroPrimary: "Получить номер",
    heroSecondary: "Посмотреть, как работает",
    heroFacts: [
      "По Ташкенту — завтра",
      "Payme · Click · Uzum",
      "Нет NFC — есть QR",
    ],
    heroPhotoAlt: "Момент касания карты телефоном",

    tryTitle: "Попробуйте до покупки",
    tryLead:
      "Наведите камеру на этот код — прямо сейчас, ничего не устанавливая. То, что откроется, — настоящий профиль FLEX, а не картинка.",
    tryButton: "Открыть пример профиля",
    tryCaption: "пример номера",

    howTitle: "Три шага",
    howSteps: [
      {
        title: "Выбираете номер",
        body:
          "Случайный или тот, что понравился. Номер ваш навсегда — потеряется карта, тот же номер будет на новой.",
        photo: "/mahsulot/karta.jpg",
        alt: "Карта FLEX с номером",
      },
      {
        title: "Выбираете вещь",
        body:
          "Карта, кольцо, браслет, автовизитка, жетон для животного. Одну или несколько — номер один на всё.",
        photo: "/mahsulot/qurilmalar.jpg",
        alt: "Устройства FLEX в ряд",
      },
      {
        title: "Касаетесь",
        body:
          "Человек прикладывает телефон, открывается ваш профиль. Контакт сохраняется одним нажатием. А у вас остаётся запись — кто, когда, где.",
        photo: "/mahsulot/skan.jpg",
        alt: "Телефон считывает устройство FLEX",
      },
    ],

    devicesTitle: "Один номер, несколько форм",
    devicesAll: "Смотреть все",
    priceOnRequest: "цена по запросу",

    audienceTitle: "Для кого",
    audienceMore: "Подробнее",
    audiences: [
      {
        name: "Человек",
        points: [
          "Ссылки, цены на услуги, рекомендации — на одной странице",
          "Кто и когда коснулся — статистика",
          "Список контактов: показывает, кому написать утром",
        ],
        href: "/shaxsiy",
      },
      {
        name: "Компания",
        points: [
          "Номер каждому сотруднику, дизайн один",
          "Сотрудник ушёл — номер остаётся в компании",
          "Счёт-фактура, один платёж",
        ],
        href: "/biznes#jamoa",
      },
      {
        name: "Кафе и магазин",
        points: [
          "QR и NFC на каждом столе — меню на трёх языках",
          "Гость просит воду — приходит в Telegram официанта",
          "В конце месяца один отчёт",
        ],
        href: "/biznes",
      },
    ],

    tractionTitle: "На сегодня",
    tractionUnit: "номеров выдано",
    tractionLatest: "Выданы последними",
    tractionLeft: "номеров свободно",

    trust: [
      {
        q: "NFC — не новинка",
        a: "Бесконтактная оплата вашей картой Humo или Uzcard — та же технология. Телефоны читают её с 2018 года.",
      },
      {
        q: "В телефоне нет NFC?",
        a: "На каждой вещи есть и QR. Открывается камерой.",
      },
      {
        q: "А если карта потеряется?",
        a: "Номер остаётся у вас. Заказываете новую карту — с тем же номером.",
      },
      {
        q: "Где данные?",
        a: "Профиль удаляете в любой момент. Скроете телефон — его никто не увидит.",
      },
    ],

    pricesTitle: "Цена — без скрытых платежей",
    pricesStart: "Начало",
    pricesSub: "Подписка",
    pricesAfter: "Если подписка закончится",
    pricesFree: "Бесплатно",
    perMonth: "в месяц",
    perSeat: "за сотрудника",
    pricesCta: "Выбрать",

    faqTitle: "Вопросы",
    faqs: [
      {
        q: "Нужно ли устанавливать приложение?",
        a: "Нет. Ни вам, ни тому, кто коснулся. Всё открывается в браузере.",
      },
      {
        q: "Работает на iPhone?",
        a: "На всех начиная с iPhone 7. Android — почти все после 2018 года. Для телефонов постарше на каждой вещи есть QR.",
      },
      {
        q: "Что увидит человек, который коснулся карты?",
        a: "Только то, что вы открыли. Скроете номер телефона — его не будет видно.",
      },
      {
        q: "Можно ли поменять номер?",
        a: "Номер ваш навсегда. Но его можно передать другому человеку — из кабинета.",
      },
      {
        q: "Доставляете в области?",
        a: "Да. Ташкент — завтра, области — 2–3 дня.",
      },
      {
        q: "Как оплатить?",
        a: "Payme, Click, Uzum. Для юридических лиц — счёт-фактура.",
      },
    ],

    finalTitle: "Выберите свой номер",
    finalLetters: "Три буквы",
    finalDigits: "Три цифры",
    finalSubmit: "Продолжить с этим номером",
    finalError: "Нужны три буквы и три цифры — например ABC123",
    finalHint: "Свободен ли он и сколько стоит — на следующей странице",

    footProduct: "Продукт",
    footBusiness: "Бизнес",
    footHelp: "Помощь",
    footCompany: "Компания",
    footHours: "Понедельник–суббота, 10:00–19:00",
    footOffer: "Публичная оферта",
    footInn: "ИНН",
  },

  en: {
    navPersonal: "Personal",
    navBusiness: "Business",
    navVenue: "Venue",
    navPrices: "Pricing",
    navFaq: "Questions",
    navCta: "Get a number",

    heroEyebrow: "Tashkent · since 2025",
    heroTitle: "Touch the phone. The introduction is done.",
    heroLead:
      "FLEX is your number for life. A card, a ring or a band. The phone that touches it opens your profile. No app to install — not for you, not for them.",
    heroPlateNote: "a number like this becomes yours",
    heroPrimary: "Get a number",
    heroSecondary: "See it working",
    heroFacts: [
      "Next-day delivery in Tashkent",
      "Payme · Click · Uzum",
      "No NFC? Every item carries a QR",
    ],
    heroPhotoAlt: "A card being touched to a phone",

    tryTitle: "Try it before you buy it",
    tryLead:
      "Point your camera at this code — right now, with nothing installed. What opens is a real FLEX profile, not a picture of one.",
    tryButton: "Open the sample profile",
    tryCaption: "sample number",

    howTitle: "Three steps",
    howSteps: [
      {
        title: "Pick a number",
        body:
          "Random, or the one you want. The number is yours for life — lose the card and the replacement carries the same number.",
        photo: "/mahsulot/karta.jpg",
        alt: "A FLEX card showing its number",
      },
      {
        title: "Pick a thing to carry it",
        body:
          "Card, ring, band, windscreen tag, pet tag. One or several — all of them answer to the same number.",
        photo: "/mahsulot/qurilmalar.jpg",
        alt: "FLEX devices in a row",
      },
      {
        title: "Touch",
        body:
          "They hold their phone to it and your profile opens. One press saves your contact. You get a record of it — who, when, where.",
        photo: "/mahsulot/skan.jpg",
        alt: "A phone reading a FLEX device",
      },
    ],

    devicesTitle: "One number, several shapes",
    devicesAll: "See all",
    priceOnRequest: "price on request",

    audienceTitle: "Who it is for",
    audienceMore: "More",
    audiences: [
      {
        name: "A person",
        points: [
          "Links, service prices, recommendations — on one page",
          "Who touched it and when — statistics",
          "A contact list that tells you who to write to this morning",
        ],
        href: "/shaxsiy",
      },
      {
        name: "A company",
        points: [
          "A number per employee, one shared design",
          "Somebody leaves — the number stays with the company",
          "One invoice, one payment",
        ],
        href: "/biznes#jamoa",
      },
      {
        name: "A cafe or a shop",
        points: [
          "QR and NFC on every table — the menu in three languages",
          "A guest asks for water — it lands in the waiter's Telegram",
          "One report at the end of the month",
        ],
        href: "/biznes",
      },
    ],

    tractionTitle: "So far",
    tractionUnit: "numbers issued",
    tractionLatest: "Issued most recently",
    tractionLeft: "numbers still free",

    trust: [
      {
        q: "NFC is not new here",
        a: "The contactless payment on your Humo or Uzcard is the same technology. Phones have been reading it since 2018.",
      },
      {
        q: "No NFC on the phone?",
        a: "Every item carries a QR as well. The camera opens it.",
      },
      {
        q: "What if the card is lost?",
        a: "The number stays yours. Order a replacement and it carries the same one.",
      },
      {
        q: "Where does the data live?",
        a: "You can delete the profile at any moment. Keep your phone number closed and nobody sees it.",
      },
    ],

    pricesTitle: "The price, with nothing hidden under it",
    pricesStart: "To start",
    pricesSub: "Subscription",
    pricesAfter: "If the subscription lapses",
    pricesFree: "Free",
    perMonth: "a month",
    perSeat: "per employee",
    pricesCta: "Choose",

    faqTitle: "Questions",
    faqs: [
      {
        q: "Does anyone need to install an app?",
        a: "No. Not you, not the person who touched it. It all opens in the browser.",
      },
      {
        q: "Does it work on iPhone?",
        a: "On every iPhone from the 7 onwards. Android — almost anything after 2018. Older phones use the QR that is on every item.",
      },
      {
        q: "What does somebody see if they touch the card?",
        a: "Only what you left open. Hide your phone number and it is not there.",
      },
      {
        q: "Can I change the number?",
        a: "The number is yours for life. But you can transfer it to somebody else from the cabinet.",
      },
      {
        q: "Do you deliver outside Tashkent?",
        a: "Yes. Tashkent next day, the regions in two to three.",
      },
      {
        q: "How do I pay?",
        a: "Payme, Click, Uzum. Companies can be invoiced.",
      },
    ],

    finalTitle: "Choose your number",
    finalLetters: "Three letters",
    finalDigits: "Three digits",
    finalSubmit: "Continue with this number",
    finalError: "Three letters and three digits — ABC123, for example",
    finalHint: "Whether it is free, and what it costs, is on the next page",

    footProduct: "Product",
    footBusiness: "Business",
    footHelp: "Help",
    footCompany: "Company",
    footHours: "Monday–Saturday, 10:00–19:00",
    footOffer: "Public offer",
    footInn: "Tax ID",
  },
} as const;

export type HomeDict = (typeof HOME)["uz"];

export function home(lang: Lang): HomeDict {
  return HOME[lang] as HomeDict;
}
