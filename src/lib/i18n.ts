// The profile in the language the person holding the card reads.
//
// Scoped to the profile and nothing else, deliberately. The cabinet, the terms
// and the marketing pages are read by the owner, who bought from an Uzbek site;
// the profile is read by whoever they hand a card to, and in Tashkent that is
// as likely to be a Russian speaker. A card nobody can read is a card that does
// not work, which makes this a correctness problem rather than a nicety.
//
// The owner's own words — their name, bio, services, the labels on their links
// — are never touched. Only the furniture around them is.

export type Lang = "uz" | "ru" | "en";

export const DEFAULT_LANG: Lang = "uz";

const STRINGS = {
  uz: {
    call: "Qo'ng'iroq",
    email: "Email",
    address: "Manzil",
    meeting: "Uchrashuv",
    website: "Veb-sayt",
    saveContact: "Kontaktni saqlash",
    contactSaved: "Saqlandi",
    contacts: "Kontaktlar",
    follow: "Obuna bo'lish",
    following: "Obuna bo'lingan",
    card: "Vizitka",
    posts: "Postlar",
    services: "Xizmatlar",
    followers: "Obunachi",
    follows: "Obuna",
    views: "Ko'rish",
    lastSeen: "Oxirgi faollik",
    sendContact: "Kontaktimni yuborish",
    sent: "Yuborildi",
    yourName: "Ismingiz",
    phone: "Telefon",
    company: "Kompaniya",
    note: "Izoh — nima haqida gaplashmoqchisiz",
    send: "Yuborish",
    sending: "Yuborilyapti",
    cancel: "Bekor",
    reachYou: (name: string) => `${name} sizga bog'lana olishi uchun`,
    contactHint: (name: string) =>
      `Telefon yoki email — kamida bittasi. Ma'lumotingiz faqat ${name}ga boradi.`,
    checkYours: "O'z raqamingizni tekshiring",
    search: "Qidirish",
    comments: "Izohlar",
    commentPlaceholder: "Izoh yozing",
    commentSend: "Yuborish",
    commentSending: "Yuborilyapti",
    commentsEmpty: "Hali izoh yo'q.",
    commentSignIn: "Izoh yozish uchun kiring",
    recommend: "Tavsiya qilaman",
    recommended: "Tavsiya qildingiz",
    whoRecommended: "Tavsiya qilganlar",
    noPosts: "Bu profilda hali post yo'q.",
    ownItTitle: "Bu — Flex",
    ownItLead: "Bir tegish bilan ochiladigan raqamli shaxs. Noyob raqam, shaxsiy profil va NFC karta.",
    ownItCta: "O'zingiznikini oling",
  },
  ru: {
    call: "Позвонить",
    email: "Почта",
    address: "Адрес",
    meeting: "Встреча",
    website: "Сайт",
    saveContact: "Сохранить контакт",
    contactSaved: "Сохранено",
    contacts: "Контакты",
    follow: "Подписаться",
    following: "Вы подписаны",
    card: "Визитка",
    posts: "Посты",
    services: "Услуги",
    followers: "Подписчики",
    follows: "Подписки",
    views: "Просмотры",
    lastSeen: "Был в сети",
    sendContact: "Отправить свой контакт",
    sent: "Отправлено",
    yourName: "Ваше имя",
    phone: "Телефон",
    company: "Компания",
    note: "Комментарий — о чём хотите поговорить",
    send: "Отправить",
    sending: "Отправляем",
    cancel: "Отмена",
    reachYou: (name: string) => `Чтобы ${name} мог с вами связаться`,
    contactHint: (name: string) =>
      `Телефон или почта — хотя бы одно. Данные получит только ${name}.`,
    checkYours: "Проверьте свой номер",
    search: "Поиск",
    comments: "Отзывы",
    commentPlaceholder: "Напишите отзыв",
    commentSend: "Отправить",
    commentSending: "Отправляем",
    commentsEmpty: "Отзывов пока нет.",
    commentSignIn: "Войдите, чтобы оставить отзыв",
    recommend: "Рекомендую",
    recommended: "Вы рекомендуете",
    whoRecommended: "Рекомендуют",
    noPosts: "В этом профиле пока нет постов.",
    ownItTitle: "Это — Flex",
    ownItLead: "Цифровая личность, которая открывается одним касанием. Уникальный номер, личный профиль и NFC-карта.",
    ownItCta: "Получить свой",
  },
  en: {
    call: "Call",
    email: "Email",
    address: "Location",
    meeting: "Book a meeting",
    website: "Website",
    saveContact: "Save contact",
    contactSaved: "Saved",
    contacts: "Contacts",
    follow: "Follow",
    following: "Following",
    card: "Card",
    posts: "Posts",
    services: "Services",
    followers: "Followers",
    follows: "Following",
    views: "Views",
    lastSeen: "Last seen",
    sendContact: "Send your contact",
    sent: "Sent",
    yourName: "Your name",
    phone: "Phone",
    company: "Company",
    note: "Note — what would you like to discuss",
    send: "Send",
    sending: "Sending",
    cancel: "Cancel",
    reachYou: (name: string) => `So ${name} can get back to you`,
    contactHint: (name: string) =>
      `Phone or email — at least one. Your details go only to ${name}.`,
    checkYours: "Check your own number",
    search: "Search",
    comments: "Comments",
    commentPlaceholder: "Write a comment",
    commentSend: "Send",
    commentSending: "Sending",
    commentsEmpty: "No comments yet.",
    commentSignIn: "Sign in to comment",
    recommend: "Recommend",
    recommended: "You recommend",
    whoRecommended: "Recommended by",
    noPosts: "No posts on this profile yet.",
    ownItTitle: "This is Flex",
    ownItLead: "A digital identity that opens with one tap. A unique number, a profile of your own and an NFC card.",
    ownItCta: "Get your own",
  },
} as const;

export type Dict = (typeof STRINGS)["uz"];

export function dict(lang: Lang): Dict {
  return STRINGS[lang] as Dict;
}

export function isLang(value: unknown): value is Lang {
  return value === "uz" || value === "ru" || value === "en";
}

/**
 * Which language to render a profile in.
 *
 * An explicit choice in the address wins, because somebody who switched wants
 * it to stay switched and wants to be able to share the switched link. Failing
 * that, the browser's own preference — the visitor has already told their phone
 * what they read, and asking again is asking twice.
 *
 * Uzbek is the fallback for a browser asking for something none of the three
 * covers — a card printed here is likelier to be read by somebody local than by
 * a speaker of whatever the fourth language turned out to be.
 */
export function pickLang(param: unknown, acceptLanguage: string | null): Lang {
  if (isLang(param)) return param;

  for (const part of (acceptLanguage ?? "").split(",")) {
    const tag = part.split(";")[0]!.trim().toLowerCase();
    if (tag.startsWith("uz")) return "uz";
    if (tag.startsWith("ru")) return "ru";
    if (tag.startsWith("en")) return "en";
  }

  return DEFAULT_LANG;
}


// --- the site around the profile -----------------------------------------
//
// Separate from the profile's dictionary on purpose. That one is read by
// whoever was handed a card; this one by somebody deciding whether to buy. They
// change for different reasons and at different times, and merging them would
// mean every copy change to the shop risks the card.

const SITE = {
  uz: {
    navPricing: "Narxlash",
    navPersonal: "Shaxsiy",
    navBusiness: "Biznes",
    navFaq: "Savollar",
    navDevices: "Qurilmalar",
    navResidents: "Rezidentlar",
    navCabinet: "Kabinet",
    navPlans: "Tariflar",
    getHandle: "Raqam oling",
    signIn: "Kirish",
    footerTerms: "Ommaviy oferta",
    footerPlans: "Tariflar",
    footerDevices: "Qurilmalar",
    heroBadge: "Bir tegish. Ilova kerak emas.",
    calcPrice: "Narxni hisoblang",
    forBusiness: "Biznes uchun",
    nfcOn: "NFC ulandi",
    howItWorks: "Qanday ishlaydi",
    threeSteps: "Uch qadam, o'n daqiqa",
    pickHandle: "Handle tanlang",
    pickDevice: "Qurilmani tanlang",
    pickDeviceDesc: "Karta, uzuk yoki braslet. Dizaynni ham o'zingiz tanlaysiz.",
    limited: "Cheklangan miqdor",
    priceOpen: "Narx — to'liq shaffof",
    priceThree: "Narx uch qismdan iborat",
    oneTap: "Bir tegish — va sizni to'liq ko'radi",
    devices: "Qurilmalar",
    oneNumberThree: "Bitta raqam, uchta shakl",
    seeAll: "Hammasini ko'rish",
    notOneCard: "Bitta karta emas — butun jamoa",
    teamQuote: "Jamoangiz uchun hisob-kitob",
    compare: "Taqqoslash",
    feature: "Xususiyat",
    faq: "Savol-javob",
    footerTagline: "Bir tegish — va sizni to'liq ko'radi.",
    personalProfile: "Shaxsiy profil",
    teamCards: "Jamoa kartalari",
    contactCollection: "Kontakt yig'ish",
    venueLine: "Kafe va mehmonxonalar",
    priceEyebrow: "Narx",
    priceTitle: "Ikki mahsulot, ikki to'lov",
    pricePersonal: "Shaxsiy raqam",
    pricePersonalNote: "Bir marta. Raqam sizniki bo'lib qoladi.",
    priceVenue: "Obyekt — kafe, mehmonxona, do'kon",
    priceVenueNote: "Oyiga. Menyu, stol belgilari, chaqiruv va hisobot.",
    priceFrom: "dan",
    priceMonthly: "oyiga",
    seeEyebrow: "Ko'rib chiqing",
    seeTitle: "Tegizganda nima ochiladi",
    seeProfile: "Shaxsiy profil",
    seeProfileNote: "Namuna",
    seeMenu: "Kafe menyusi",
    seeMenuNote: "Haqiqiy obyekt — oching",
    demoRole: "UX dizayner, Toshkent",
    demoTagOne: "Dizayn",
    demoTagTwo: "UX",
    company: "Kompaniya",
    delivery: "Yetkazib berish va qaytarish shartlari",
    heroTitleA: "Flex — Sizning",
    heroTitleMark: "raqamli",
    heroTitleB: "shaxsingiz",
    heroLead: "Siz noyob raqam sotib olasiz — u umrbod sizniki. Uni karta, uzuk yoki braslet ko'rinishida olib yurasiz, tanlov sizniki. Har biri bitta profilni ochadi.",
    stepTap: "Tegizing",
    stepTapDesc: "Telefonga tegizasiz, profilingiz ochiladi. Hech kim ilova o'rnatmaydi.",
    stepHandleDesc: "3 harf + 3 raqam. Narx darhol ko'rinadi — yashirin to'lov yo'q.",
    namespaceDesc: "Mumkin bo'lgan handle'lar soni — boshqa yo'q. Har biri bittagina odamga tegishli bo'ladi. Kombinatsiya qanchalik kamyob bo'lsa, u shunchalik qadrli.",
    pricingDesc: "Har bir handle narxi ochiq formula bilan hisoblanadi: bazaviy narx × harf kamyobligi × raqam kamyobligi. Pastda o'zingiz sinab ko'ring.",
    subscriptionDesc: "Raqamni bir marta sotib olasiz va u sizniki. Qurilma — karta, uzuk yoki braslet — alohida mahsulot. Profil esa har oy ishlab turadi, shuning uchun platformaga obuna alohida.",
    tapDesc: "Kartani tegizasiz, brauzer o'zi ochiladi. Hech kim hech narsa o'rnatmaydi.",
    businessDesc: "Xodimlaringizga bir xil brend bilan handle va NFC karta chiqaring, tadbirlarda yig'ilgan kontaktlarni bitta panelda ko'ring.",
    seatBought: "O'rin sotib olinadi, odam emas.",
    seatFrees: "Xodim ketsa o'rin bo'shaydi, keyingisiga beriladi.",
    handleIsCompany: "Raqam firmaniki.",
    handleStays: "Xodim ketganda uning ma'lumoti o'chadi, raqam va karta firmada qoladi.",
    perSeat: "bir o'ringa, oyiga.",
    minSeats: "Eng kami",
    seatsWord: "o'rin, to'lov firmadan.",
    checkFree: "Bo'shligini tekshirish",
    letters: "Harflar",
    digits: "Raqamlar",
    basePrice: "Bazaviy narx",
    letterRarity: "Harf kamyobligi",
    digitRarity: "Raqam kamyobligi",
    totalPrice: "Jami narx",
    companyName: "Kompaniya",
    staffCount: "Nechta xodim",
    yourEmail: "Elektron pochta",
    requestQuote: "Hisob-kitob so'rash",
    received: "Qabul qilindi",
    quoteHint: "Qanday qurilma, qanday brend, qachonga kerak",
    handleError: "3 ta harf va 3 ta raqam kiriting.",
    visitsWord: "tashrif",
    thisWeek: "BU HAFTA",
    deviceNote: (from: string) => `Bu raqamning narxi. Qurilma — karta, uzuk yoki braslet — alohida tanlanadi va alohida to'lanadi, ${from}dan boshlab.`,
    topThree: "So'nggi 3 kun eng ko'p ko'rilganlar",
    noResidents: "Hali rezidentlar yo'q. Birinchi bo'lib handle oling.",
    pickHandleCta: "Handle tanlash",
    searchPlaceholder: "Ism, handle yoki shahar",
    searchWord: "Qidirish",
    nothingFound: (q: string) => `"${q}" bo'yicha hech kim topilmadi.`,
    handleCounts: (taken: string, free: string) => `${taken} ta handle band · ${free} ta bo'sh`,
    offerTitle: "Ommaviy oferta",
    offerAuthority: "Ushbu hujjatning asl matni o'zbek tilida tuzilgan. Rus va ingliz tilidagi versiyalar qulaylik uchun berilgan; nizo yuzaga kelganda o'zbek tilidagi matn hisobga olinadi.",
    tagline: "Sizning raqamli shaxsingiz",
    metaDescription: "Noyob raqam, shaxsiy profil va NFC karta. Bir tegish bilan shaxsingizni ulashing; jamoangiz uchun raqamlar chiqaring va kontakt yig'ing.",
    product: "Mahsulot",
    whyFlex: "Nega Flex?",
    tiers: { common: "Oddiy", rare: "Noyob", epic: "Epik", legendary: "Afsonaviy", genesis: "Genesis" },
    randomise: "Tasodifiy tanlash",
    takeHandle: "{handle} ni band qilish",
    formulaLabel: "Hisob",
    takenWord: "raqam band",
    leftWord: "bo'sh qoldi",
    latestWord: "so'nggi",
    navHome: "Bosh sahifa",
    navFeed: "Postlar",
    navRequests: "So'rovlar",
    moreLabel: "Batafsil",
    appNewResidents: "Yangi rezidentlar",
    menuEmpty: "Menyu hali to'ldirilmagan.",
    menuSoldOut: "Bugun yo'q",
    menuTitle: "Menyu",

    // From the table. Short, because they are read standing up and pressed with
    // one thumb.
    menuCallWaiter: "Ofitsiant",
    menuAskBill: "Hisob",
    menuLeaveReview: "Izoh",
    menuRequestSent: "Yuborildi — hozir kelishadi.",
    menuBillSent: "Yuborildi — hisob tayyorlanmoqda.",
    menuReviewSent: "Rahmat! Izohingiz yuborildi.",
    menuRequestTooSoon: "So'rov allaqachon yuborilgan.",
    menuRequestFailed: "Yuborib bo'lmadi. Qaytadan urinib ko'ring.",
    menuReviewPlaceholder: "Nima yoqdi, nima yoqmadi?",
    menuReviewSend: "Yuborish",
    menuNoPoint: "Stol raqami",
    yourHandle: "Sizning raqamingiz",
    statViews: "Ko'rish",
    statToday: "Bugun",
    statLeads: "Kontakt",
    actionQr: "QR-kod",
    actionEdit: "Tahrirlash",
    actionDevice: "Qurilma",
    leadsWaiting: (n: string) => `${n} ta yangi kontakt kutmoqda`,
    waysEyebrow: "Nima kerak?",
    wayPersonal: "Shaxsiy NFC",
    wayPersonalDesc: "O'zingiz uchun: noyob raqam, shaxsiy profil va karta, uzuk yoki braslet. Bir tegish — kontaktingiz o'tadi.",
    wayPersonalCta: "Raqam tanlash",
    wayBusiness: "Biznes uchun NFC",
    wayBusinessDesc: "Kafe, mehmonxona, do'kon va jamoa uchun: menyu, xona xizmatlari, kassadagi to'lov va xodim kartalari.",
    wayBusinessCta: "Biznes bo'limi",
    menuOpen: "Menyu",
    menuClose: "Yopish",
    langName: "O'zbekcha",
  },
  ru: {
    navPricing: "Цены",
    navPersonal: "Личный",
    navBusiness: "Бизнес",
    navFaq: "Вопросы",
    navDevices: "Устройства",
    navResidents: "Резиденты",
    navCabinet: "Кабинет",
    navPlans: "Тарифы",
    getHandle: "Получить номер",
    signIn: "Войти",
    footerTerms: "Публичная оферта",
    footerPlans: "Тарифы",
    footerDevices: "Устройства",
    heroBadge: "Одно касание. Приложение не нужно.",
    calcPrice: "Рассчитать цену",
    forBusiness: "Для бизнеса",
    nfcOn: "NFC подключён",
    howItWorks: "Как это работает",
    threeSteps: "Три шага, десять минут",
    pickHandle: "Выберите номер",
    pickDevice: "Выберите устройство",
    pickDeviceDesc: "Карта, кольцо или браслет. Дизайн тоже выбираете вы.",
    limited: "Количество ограничено",
    priceOpen: "Цена — полностью открыто",
    priceThree: "Цена состоит из трёх частей",
    oneTap: "Одно касание — и вас видят целиком",
    devices: "Устройства",
    oneNumberThree: "Один номер, три формы",
    seeAll: "Смотреть все",
    notOneCard: "Не одна карта — вся команда",
    teamQuote: "Расчёт для вашей команды",
    compare: "Сравнение",
    feature: "Возможность",
    faq: "Вопросы и ответы",
    footerTagline: "Одно касание — и вас видят полностью.",
    personalProfile: "Личный профиль",
    teamCards: "Карты для команды",
    contactCollection: "Сбор контактов",
    venueLine: "Кафе и отели",
    priceEyebrow: "Цена",
    priceTitle: "Два продукта, две оплаты",
    pricePersonal: "Личный номер",
    pricePersonalNote: "Разово. Номер остаётся вашим.",
    priceVenue: "Объект — кафе, отель, магазин",
    priceVenueNote: "В месяц. Меню, метки на столы, вызов и отчёт.",
    priceFrom: "от",
    priceMonthly: "в месяц",
    seeEyebrow: "Посмотрите",
    seeTitle: "Что открывается при касании",
    seeProfile: "Личный профиль",
    seeProfileNote: "Образец",
    seeMenu: "Меню кафе",
    seeMenuNote: "Настоящий объект — откройте",
    demoRole: "UX-дизайнер, Ташкент",
    demoTagOne: "Дизайн",
    demoTagTwo: "UX",
    company: "Компания",
    delivery: "Доставка и условия возврата",
    heroTitleA: "Flex — Ваша",
    heroTitleMark: "цифровая",
    heroTitleB: "личность",
    heroLead: "Вы покупаете уникальный номер — и он ваш навсегда. Носите его картой, кольцом или браслетом, выбор за вами. Каждый открывает один и тот же профиль.",
    stepTap: "Поднесите",
    stepTapDesc: "Подносите к телефону — профиль открывается. Приложение никому ставить не нужно.",
    stepHandleDesc: "3 буквы + 3 цифры. Цена видна сразу — скрытых платежей нет.",
    namespaceDesc: "Столько номеров возможно — и больше не будет. Каждый принадлежит одному человеку. Чем реже сочетание, тем оно дороже.",
    pricingDesc: "Цена каждого номера считается по открытой формуле: базовая цена × редкость букв × редкость цифр. Проверьте расчёт ниже.",
    subscriptionDesc: "Номер покупается один раз и остаётся вашим. Устройство — карта, кольцо или браслет — отдельный товар. А профиль работает каждый месяц, поэтому подписка на платформу отдельно.",
    tapDesc: "Подносите карту — браузер открывается сам. Никто ничего не устанавливает.",
    businessDesc: "Выдайте сотрудникам номера и NFC-карты в едином фирменном стиле, а контакты с мероприятий смотрите в одной панели.",
    seatBought: "Покупается место, а не человек.",
    seatFrees: "Сотрудник ушёл — место освободилось и перешло следующему.",
    handleIsCompany: "Номер принадлежит компании.",
    handleStays: "Сотрудник уходит — его данные стираются, номер и карта остаются у компании.",
    perSeat: "за место в месяц.",
    minSeats: "Минимум",
    seatsWord: "мест, оплата от компании.",
    checkFree: "Проверить свободен ли",
    letters: "Буквы",
    digits: "Цифры",
    basePrice: "Базовая цена",
    letterRarity: "Редкость букв",
    digitRarity: "Редкость цифр",
    totalPrice: "Итого",
    companyName: "Компания",
    staffCount: "Сколько сотрудников",
    yourEmail: "Электронная почта",
    requestQuote: "Запросить расчёт",
    received: "Принято",
    quoteHint: "Какое устройство, какой брендинг, к какому сроку",
    handleError: "Введите 3 буквы и 3 цифры.",
    visitsWord: "визитов",
    thisWeek: "НА ЭТОЙ НЕДЕЛЕ",
    deviceNote: (from: string) => `Это цена номера. Устройство — карта, кольцо или браслет — выбирается и оплачивается отдельно, от ${from}.`,
    topThree: "Самые просматриваемые за 3 дня",
    noResidents: "Резидентов пока нет. Займите номер первым.",
    pickHandleCta: "Выбрать номер",
    searchPlaceholder: "Имя, номер или город",
    searchWord: "Поиск",
    nothingFound: (q: string) => `По запросу "${q}" никого не нашлось.`,
    handleCounts: (taken: string, free: string) => `${taken} номеров занято · ${free} свободно`,
    offerTitle: "Публичная оферта",
    offerAuthority: "Оригинал этого документа составлен на узбекском языке. Русская и английская версии приведены для удобства; при разногласиях применяется узбекский текст.",
    tagline: "Ваша цифровая личность",
    metaDescription: "Уникальный номер, личный профиль и NFC-карта. Делитесь собой одним касанием; выдавайте номера команде и собирайте контакты.",
    product: "Продукт",
    whyFlex: "Почему Flex?",
    tiers: { common: "Обычный", rare: "Редкий", epic: "Эпический", legendary: "Легендарный", genesis: "Genesis" },
    randomise: "Случайный",
    takeHandle: "Занять {handle}",
    formulaLabel: "Расчёт",
    takenWord: "номеров занято",
    leftWord: "свободно",
    latestWord: "последние",
    navHome: "Главная",
    navFeed: "Посты",
    navRequests: "Запросы",
    moreLabel: "Подробнее",
    appNewResidents: "Новые резиденты",
    menuEmpty: "Меню пока не заполнено.",
    menuSoldOut: "Сегодня нет",
    menuTitle: "Меню",

    menuCallWaiter: "Официант",
    menuAskBill: "Счёт",
    menuLeaveReview: "Отзыв",
    menuRequestSent: "Отправлено — сейчас подойдут.",
    menuBillSent: "Отправлено — счёт готовят.",
    menuReviewSent: "Спасибо! Отзыв отправлен.",
    menuRequestTooSoon: "Запрос уже отправлен.",
    menuRequestFailed: "Не удалось отправить. Попробуйте ещё раз.",
    menuReviewPlaceholder: "Что понравилось, что нет?",
    menuReviewSend: "Отправить",
    menuNoPoint: "Номер стола",
    yourHandle: "Ваш номер",
    statViews: "Просмотры",
    statToday: "Сегодня",
    statLeads: "Контакты",
    actionQr: "QR-код",
    actionEdit: "Изменить",
    actionDevice: "Устройство",
    leadsWaiting: (n: string) => `${n} новых контактов ждут`,
    waysEyebrow: "Что вам нужно?",
    wayPersonal: "Личный NFC",
    wayPersonalDesc: "Для себя: уникальный номер, личный профиль и карта, кольцо или браслет. Одно касание — и контакт передан.",
    wayPersonalCta: "Выбрать номер",
    wayBusiness: "NFC для бизнеса",
    wayBusinessDesc: "Для кафе, отелей, магазинов и команд: меню, обслуживание в номере, оплата на кассе и карты сотрудников.",
    wayBusinessCta: "Раздел для бизнеса",
    menuOpen: "Меню",
    menuClose: "Закрыть",
    langName: "Русский",
  },
  en: {
    navPricing: "Pricing",
    navPersonal: "Personal",
    navBusiness: "Business",
    navFaq: "FAQ",
    navDevices: "Devices",
    navResidents: "Residents",
    navCabinet: "Cabinet",
    navPlans: "Plans",
    getHandle: "Get a number",
    signIn: "Sign in",
    footerTerms: "Public offer",
    footerPlans: "Plans",
    footerDevices: "Devices",
    heroBadge: "One tap. No app to install.",
    calcPrice: "Calculate the price",
    forBusiness: "For business",
    nfcOn: "NFC connected",
    howItWorks: "How it works",
    threeSteps: "Three steps, ten minutes",
    pickHandle: "Choose a handle",
    pickDevice: "Choose a device",
    pickDeviceDesc: "Card, ring or bracelet. You choose the design as well.",
    limited: "A finite number",
    priceOpen: "The price, in full view",
    priceThree: "The price has three parts",
    oneTap: "One tap — and they see all of you",
    devices: "Devices",
    oneNumberThree: "One handle, three forms",
    seeAll: "See all",
    notOneCard: "Not one card — the whole team",
    teamQuote: "A quote for your team",
    compare: "Compared",
    feature: "Feature",
    faq: "Questions",
    footerTagline: "One tap, and they see all of you.",
    personalProfile: "Personal profile",
    teamCards: "Team cards",
    contactCollection: "Contact collection",
    venueLine: "Cafes and hotels",
    priceEyebrow: "Price",
    priceTitle: "Two products, two payments",
    pricePersonal: "A personal number",
    pricePersonalNote: "Once. The number stays yours.",
    priceVenue: "A venue — cafe, hotel, shop",
    priceVenueNote: "Monthly. Menu, table tags, calls and a report.",
    priceFrom: "from",
    priceMonthly: "a month",
    seeEyebrow: "Have a look",
    seeTitle: "What opens when you tap",
    seeProfile: "A personal profile",
    seeProfileNote: "A sample",
    seeMenu: "A cafe menu",
    seeMenuNote: "A real venue — open it",
    demoRole: "UX designer, Tashkent",
    demoTagOne: "Design",
    demoTagTwo: "UX",
    company: "Company",
    delivery: "Delivery and returns",
    heroTitleA: "Flex — Your",
    heroTitleMark: "digital",
    heroTitleB: "identity",
    heroLead: "You buy a handle and it stays yours. Carry it as a card, a ring or a bracelet — your choice. All three open the same profile.",
    stepTap: "Tap it",
    stepTapDesc: "Hold it to a phone and your profile opens. Nobody installs an app.",
    stepHandleDesc: "Three letters, three digits. The price is shown straight away — nothing hidden.",
    namespaceDesc: "That is how many handles exist, and there will be no more. Each belongs to one person, and the rarer the combination the more it is worth.",
    pricingDesc: "Every handle is priced by a formula you can see: a base price × how rare the letters are × how rare the digits are. Try it below.",
    subscriptionDesc: "The handle is bought once and stays yours. The device — card, ring or bracelet — is a separate product. The profile runs every month, so the platform is subscribed to separately.",
    tapDesc: "Tap the card and the browser opens by itself. Nobody installs anything.",
    businessDesc: "Issue your staff handles and NFC cards in one house style, and see the contacts collected at events in a single panel.",
    seatBought: "You buy a seat, not a person.",
    seatFrees: "When somebody leaves the seat frees up and goes to the next hire.",
    handleIsCompany: "The handle belongs to the company.",
    handleStays: "When somebody leaves their details are wiped; the number and the card stay with the firm.",
    perSeat: "per seat, per month.",
    minSeats: "Minimum",
    seatsWord: "seats, billed to the company.",
    checkFree: "Check if it's free",
    letters: "Letters",
    digits: "Digits",
    basePrice: "Base price",
    letterRarity: "Letter rarity",
    digitRarity: "Digit rarity",
    totalPrice: "Total",
    companyName: "Company",
    staffCount: "How many staff",
    yourEmail: "Email",
    requestQuote: "Request a quote",
    received: "Received",
    quoteHint: "Which device, what branding, by when",
    handleError: "Enter three letters and three digits.",
    visitsWord: "visits",
    thisWeek: "THIS WEEK",
    deviceNote: (from: string) => `That is the price of the handle. The device — card, ring or bracelet — is chosen and paid for separately, from ${from}.`,
    topThree: "Most viewed over three days",
    noResidents: "No residents yet. Be the first to take a handle.",
    pickHandleCta: "Choose a handle",
    searchPlaceholder: "Name, handle or city",
    searchWord: "Search",
    nothingFound: (q: string) => `Nobody found for "${q}".`,
    handleCounts: (taken: string, free: string) => `${taken} handles taken · ${free} free`,
    offerTitle: "Public offer",
    offerAuthority: "The original of this document is drawn up in Uzbek. The Russian and English versions are provided for convenience; in the event of a discrepancy the Uzbek text governs.",
    tagline: "Your digital identity",
    metaDescription: "A unique handle, your own profile and an NFC card. Share yourself with one tap; issue handles to your team and collect contacts.",
    product: "Product",
    whyFlex: "Why Flex?",
    tiers: { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", genesis: "Genesis" },
    randomise: "Random",
    takeHandle: "Take {handle}",
    formulaLabel: "Calculation",
    takenWord: "handles taken",
    leftWord: "still free",
    latestWord: "latest",
    navHome: "Home",
    navFeed: "Posts",
    navRequests: "Requests",
    moreLabel: "More",
    appNewResidents: "New residents",
    menuEmpty: "The menu is not filled in yet.",
    menuSoldOut: "Off today",
    menuTitle: "Menu",

    menuCallWaiter: "Waiter",
    menuAskBill: "Bill",
    menuLeaveReview: "Review",
    menuRequestSent: "Sent — someone is on the way.",
    menuBillSent: "Sent — your bill is being prepared.",
    menuReviewSent: "Thank you! Your review was sent.",
    menuRequestTooSoon: "That request has already been sent.",
    menuRequestFailed: "Could not send. Please try again.",
    menuReviewPlaceholder: "What worked, what didn't?",
    menuReviewSend: "Send",
    menuNoPoint: "Table number",
    yourHandle: "Your number",
    statViews: "Views",
    statToday: "Today",
    statLeads: "Contacts",
    actionQr: "QR code",
    actionEdit: "Edit",
    actionDevice: "Device",
    leadsWaiting: (n: string) => `${n} new contacts waiting`,
    waysEyebrow: "What do you need?",
    wayPersonal: "Personal NFC",
    wayPersonalDesc: "For yourself: a unique number, your own profile and a card, ring or bracelet. One tap and they have your contact.",
    wayPersonalCta: "Pick a number",
    wayBusiness: "NFC for business",
    wayBusinessDesc: "For cafes, hotels, shops and teams: menus, in-room service, payment at the till and staff cards.",
    wayBusinessCta: "The business section",
    menuOpen: "Menu",
    menuClose: "Close",
    langName: "English",
  },
} as const;

export type SiteDict = (typeof SITE)["uz"];

export function site(lang: Lang): SiteDict {
  return SITE[lang] as SiteDict;
}


// --- the landing copy ----------------------------------------------------
//
// Moved out of the page so the three languages sit beside each other and a
// claim cannot be true in one and false in another.
//
// Four claims were corrected on the way rather than translated. The page
// promised CRM synchronisation with HubSpot and Salesforce, which does not
// exist in any form; Stripe, which is not connected; and unlimited staff on the
// team plan, which contradicts the seats it actually sells. Translating those
// would have turned one false claim into three.

const LANDING = {
  uz: {
    consumer: [
      {
        title: "Shaxsiy profil",
        desc: "flex.com.uz/HANDLE — barcha havolalaringiz, ijtimoiy tarmoqlaringiz va vizit ma'lumotlaringiz bitta sahifada.",
      },
      {
        title: "Qurilmani o'zingiz tanlaysiz",
        desc: "Karta, uzuk yoki braslet — uchalasi ham bir tegishda o'sha profilni ochadi. NFC yo'q telefonlar uchun QR-kod zaxira variant.",
      },
      {
        title: "Kamyob handle",
        desc: "3 harf + 3 raqam — cheklangan miqdor. Kamdan-kam kombinatsiyalar qimmatroq, shaffof narx bilan.",
      },
      {
        title: "Analitika",
        desc: "Profilingiz necha marta ochilgani, qaysi havola bosilgani va tashrif kartani tegizishdanmi yoki QR'danmi — hammasi ko'rinadi.",
      },
      {
        title: "Avtovizitka",
        desc: "Mashinangiz old oynasiga QR va NFC plastina. Yo'lda to'sib qo'ysangiz yoki faralar yoqiq qolsa — sizga xabar keladi, telefon raqamingiz esa ochilmaydi.",
      },
    ],
    business: [
      {
        title: "Jamoa uchun raqamlar",
        desc: "Xodimlaringizga bir blokdan raqam va karta chiqaring. Firma nomi va logotipi hamma profilga o'zi qo'yiladi.",
      },
      {
        title: "Kontakt yig'ish",
        desc: "Profilni ochgan odam o'z ismi va telefonini qoldiradi. Tadbirdan keyin tayyor ro'yxat — Excel'ga chiqariladi.",
      },
      {
        title: "O'rin bo'shaydi, yonmaydi",
        desc: "Xodim ketsa raqam firmada qoladi, uning ma'lumoti o'chadi va o'rin keyingi xodimga beriladi.",
      },
      {
        title: "Jamoa analitikasi",
        desc: "Barcha raqamlar bo'yicha jami tashriflar va kelgan kontaktlar — bitta panelda.",
      },
    ],
    comparison: [
      "Kamyob raqam",
      "Shaffof narx hisoblagichi",
      "Jismoniy NFC karta",
      "Jamoa tarifi",
      "Kontakt yig'ish",
      "Click / Payme to'lovlari",
    ],
    faqs: [
      {
        q: "Raqam nima va u qanday narxlanadi?",
        a: "Raqam — 3 harf + 3 raqamdan iborat noyob kod (masalan MYN042), sizning profilingiz manzili bo'ladi. Narx bazaviy summadan, harflar va raqamlarning kamyobligiga qarab ko'payadigan koeffitsientlardan hisoblanadi. Narxlash sahifasida istalgan kombinatsiyani yozib, narxini darhol ko'rasiz.",
      },
      {
        q: "NFC qurilma qanday ishlaydi?",
        a: "Qurilmani (karta, uzuk yoki braslet) boshqa telefonga tegizganingizda, sizning flex.com.uz profilingiz avtomatik ochiladi. Hech kim ilova o'rnatmaydi. NFC qo'llamaydigan telefonlar uchun QR-kod zaxira variant sifatida ishlaydi.",
      },
      {
        q: "Kafe yoki mehmonxonaga nima beradi?",
        a: "Har stol yoki xonaga alohida QR va NFC belgisi tegadi. Mehmon tegizadi — menyu yoki xizmatlar ro'yxati ochiladi, u yerdan ofitsiantni chaqiradi, hisob so'raydi yoki izoh qoldiradi. So'rov qaysi stoldan kelgani bilan kassadagi telefonda ovoz bilan chiqadi. Oyiga o'rtacha javob vaqti va qaysi stol ko'p chaqirgani hisobotda ko'rinadi.",
      },
      {
        q: "Jamoa uchun qancha xodim qo'shsam bo'ladi?",
        a: "Jamoa tarifi o'rinlar bo'yicha sotiladi, eng kami 5 ta. O'rin odamga emas, firmaga tegishli: xodim ketsa o'rin bo'shaydi va keyingisiga beriladi.",
      },
      {
        q: "To'lovni qanday amalga oshiraman?",
        a: "Raqam va shaxsiy obuna uchun — Payme. Kafe, mehmonxona va firmalar uchun — hisob-faktura va bank o'tkazmasi: hujjatni kabinetdan o'zingiz olasiz, pul kelgach obuna uzayadi.",
      },
    ],
  },
  ru: {
    consumer: [
      {
        title: "Личный профиль",
        desc: "flex.com.uz/НОМЕР — все ваши ссылки, соцсети и контактные данные на одной странице.",
      },
      {
        title: "Устройство выбираете сами",
        desc: "Карта, кольцо или браслет — все три открывают тот же профиль одним касанием. Для телефонов без NFC работает QR-код.",
      },
      {
        title: "Редкий номер",
        desc: "3 буквы + 3 цифры — количество ограничено. Редкие сочетания стоят дороже, цена считается открыто.",
      },
      {
        title: "Аналитика",
        desc: "Сколько раз открыли профиль, по какой ссылке перешли и откуда пришли — с карты, по QR или по ссылке.",
      },
      {
        title: "Автовизитка",
        desc: "QR и NFC-пластина на лобовое стекло. Перегородили проезд или у вас горят фары — вам напишут, а телефон останется закрытым.",
      },
    ],
    business: [
      {
        title: "Номера для команды",
        desc: "Выдайте сотрудникам номера и карты из одного блока. Название и логотип компании подставляются во все профили.",
      },
      {
        title: "Сбор контактов",
        desc: "Тот, кто открыл профиль, оставляет своё имя и телефон. После мероприятия — готовый список, выгружается в Excel.",
      },
      {
        title: "Место освобождается, а не сгорает",
        desc: "Сотрудник ушёл — номер остаётся у компании, его данные стираются, место переходит следующему.",
      },
      {
        title: "Аналитика по команде",
        desc: "Просмотры и собранные контакты по всем номерам сразу — в одной панели.",
      },
    ],
    comparison: [
      "Редкий номер",
      "Открытый расчёт цены",
      "Физическая NFC-карта",
      "Тариф для команды",
      "Сбор контактов",
      "Оплата Click / Payme",
    ],
    faqs: [
      {
        q: "Что такое номер и как считается цена?",
        a: "Номер — это уникальный код из 3 букв и 3 цифр (например MYN042), он становится адресом вашего профиля. Цена считается от базовой суммы с коэффициентами за редкость букв и цифр. На странице цен наберите любую комбинацию и сразу увидите её стоимость.",
      },
      {
        q: "Как работает NFC-устройство?",
        a: "Подносите устройство (карту, кольцо или браслет) к чужому телефону — ваш профиль flex.com.uz открывается сам. Приложение никому ставить не нужно. Для телефонов без NFC есть QR-код.",
      },
      {
        q: "Что это даёт кафе или отелю?",
        a: "У каждого стола или номера свой QR и своя NFC-метка. Гость подносит телефон — открывается меню или список услуг, оттуда же зовёт официанта, просит счёт или оставляет отзыв. Запрос приходит на телефон у кассы со звуком и с номером стола. В отчёте за месяц видно среднее время ответа и какой стол зовёт чаще.",
      },
      {
        q: "Сколько сотрудников можно добавить?",
        a: "Тариф для команды продаётся по местам, минимум 5. Место принадлежит компании, а не человеку: сотрудник уходит — место освобождается и переходит следующему.",
      },
      {
        q: "Как оплатить?",
        a: "Номер и личную подписку — через Payme. Кафе, отели и компании — по счёт-фактуре и банковским переводом: документ выдаётся прямо в кабинете, подписка продлевается после поступления денег.",
      },
    ],
  },
  en: {
    consumer: [
      {
        title: "Your own profile",
        desc: "flex.com.uz/HANDLE — every link, social account and contact detail you have, on one page.",
      },
      {
        title: "You pick the device",
        desc: "Card, ring or bracelet — all three open the same profile with one tap. Phones without NFC get a QR code instead.",
      },
      {
        title: "A scarce handle",
        desc: "Three letters and three digits, and a finite number of them. Rarer combinations cost more, on a price you can see being calculated.",
      },
      {
        title: "Analytics",
        desc: "How often the profile was opened, which link was tapped, and whether the visit came from the card, a QR code or a shared link.",
      },
      {
        title: "Car card",
        desc: "A QR and NFC plate for the windscreen. Blocked someone in, or left your lights on, and they can reach you — while your phone number stays closed.",
      },
    ],
    business: [
      {
        title: "Handles for a team",
        desc: "Issue your staff numbers and cards from one block. The company name and logo are filled in on every profile.",
      },
      {
        title: "Collect contacts",
        desc: "Whoever opens the profile can leave their name and number. After an event you have a list, and it exports to Excel.",
      },
      {
        title: "A seat frees up, it doesn't burn",
        desc: "When somebody leaves, the number stays with the company, their details are wiped and the seat goes to the next person.",
      },
      {
        title: "Team analytics",
        desc: "Views and contacts collected across every number on the account, in one place.",
      },
    ],
    comparison: [
      "Scarce handle",
      "Transparent price calculator",
      "Physical NFC card",
      "Team plan",
      "Contact collection",
      "Click / Payme payments",
    ],
    faqs: [
      {
        q: "What is a number and how is it priced?",
        a: "A number is a unique code of three letters and three digits — MYN042, say — and it becomes the address of your profile. The price starts from a base and rises with how rare the letters and digits are. Type any combination on the pricing page and its price appears straight away.",
      },
      {
        q: "How does the NFC device work?",
        a: "Hold the device — card, ring or bracelet — to somebody's phone and your flex.com.uz profile opens by itself. Nobody installs an app. Phones without NFC use the QR code instead.",
      },
      {
        q: "What does it do for a cafe or a hotel?",
        a: "Every table or room gets its own QR code and its own NFC tag. A guest taps it, the menu or service list opens, and from there they call a waiter, ask for the bill or leave a review. The request arrives on the phone by the till with a sound and with the table number on it. The monthly report shows the average time to answer and which table calls most.",
      },
      {
        q: "How many staff can I add?",
        a: "The team plan is sold by the seat, minimum five. A seat belongs to the company rather than to a person: when somebody leaves it frees up and goes to the next hire.",
      },
      {
        q: "How do I pay?",
        a: "Payme for a number and a personal subscription. Cafes, hotels and companies pay by invoice and bank transfer: the document is issued in the cabinet and the subscription is extended when the money arrives.",
      },
    ],
  },
} as const;

export type LandingDict = (typeof LANDING)["uz"];

export function landing(lang: Lang): LandingDict {
  return LANDING[lang] as LandingDict;
}


// --- the catalogue -------------------------------------------------------
//
// Names and descriptions for the things being sold, keyed by the ids in
// devices.ts and plans.ts. The prices, the limits and the ids stay in those
// files: a price is not a translation, and a plan that costs a different amount
// in a different language would be a bug rather than a feature.

const CATALOGUE = {
  uz: {
    devices: {
      card: {
        name: "Karta",
        tagline: "Cho'ntakda, hamyonda",
        description: "Bank kartasi o'lchamida. NFC chip va QR-kod bilan — tegizasiz yoki skanerlaysiz.",
      },
      ring: {
        name: "Uzuk",
        tagline: "Qo'lda, doim o'zingiz bilan",
        description: "Hech narsa olib yurish shart emas. Qo'l siltashning o'zi profilingizni ochadi.",
      },
      bracelet: {
        name: "Braslet",
        tagline: "Bilakda, tadbirlar uchun",
        description: "Tadbir va konferensiyalarda qulay: qo'lingiz band bo'lsa ham bir tegish yetadi.",
      },
    },
    plans: {
      free: { name: "Oddiy", tagline: "Raqam narxiga kiritilgan" },
      premium: { name: "Premium", tagline: "Profilni to'liq ishlatish uchun" },
    },
    perMonth: "oyiga",
    perYear: (sum: string, months: number) => `Yiliga ${sum} — ${months} oy bepul`,
    includesFree: (links: number, services: number) => [
      "Shaxsiy profil sahifasi",
      `${links} tagacha havola`,
      `${services} tagacha xizmat va narx`,
      "QR-kod",
      "Kontaktni saqlash tugmasi",
      "Umumiy tashriflar soni",
      "Katalogdagi dizaynlar",
    ],
    includesPremium: (services: number) => [
      "Cheksiz havolalar",
      `${services} tagacha xizmat va narx`,
      "To'liq analitika — kunlik grafik va har bir havola bo'yicha",
      "Kelgan kontaktlar va ularni Excel'ga chiqarish",
      "O'z fon rasmingiz",
      "Oltin bezak",
      "Sahifadagi Flex yozuvi olib tashlanadi",
    ],
  },
  ru: {
    devices: {
      card: {
        name: "Карта",
        tagline: "В кармане, в кошельке",
        description: "Размером с банковскую карту. С NFC-чипом и QR-кодом — подносите или сканируйте.",
      },
      ring: {
        name: "Кольцо",
        tagline: "На руке, всегда с вами",
        description: "Носить с собой ничего не нужно. Достаточно движения руки — профиль открыт.",
      },
      bracelet: {
        name: "Браслет",
        tagline: "На запястье, для мероприятий",
        description: "Удобно на конференциях: даже если руки заняты, хватает одного касания.",
      },
    },
    plans: {
      free: { name: "Обычный", tagline: "Входит в цену номера" },
      premium: { name: "Premium", tagline: "Чтобы профиль работал полностью" },
    },
    perMonth: "в месяц",
    perYear: (sum: string, months: number) => `${sum} в год — ${months} месяца бесплатно`,
    includesFree: (links: number, services: number) => [
      "Страница личного профиля",
      `До ${links} ссылок`,
      `До ${services} услуг с ценами`,
      "QR-код",
      "Кнопка сохранения контакта",
      "Общее число визитов",
      "Дизайны из каталога",
    ],
    includesPremium: (services: number) => [
      "Ссылки без ограничений",
      `До ${services} услуг с ценами`,
      "Полная аналитика — по дням и по каждой ссылке",
      "Собранные контакты и выгрузка в Excel",
      "Своя фоновая картинка",
      "Золотое оформление",
      "Надпись Flex со страницы убирается",
    ],
  },
  en: {
    devices: {
      card: {
        name: "Card",
        tagline: "In a pocket, in a wallet",
        description: "The size of a bank card, with an NFC chip and a QR code — tap it or scan it.",
      },
      ring: {
        name: "Ring",
        tagline: "On your hand, always with you",
        description: "Nothing to carry. A movement of your hand opens the profile.",
      },
      bracelet: {
        name: "Bracelet",
        tagline: "On the wrist, for events",
        description: "Useful at conferences: one tap is enough even with your hands full.",
      },
    },
    plans: {
      free: { name: "Standard", tagline: "Included in the price of the handle" },
      premium: { name: "Premium", tagline: "For the profile working in full" },
    },
    perMonth: "a month",
    perYear: (sum: string, months: number) => `${sum} a year — ${months} months free`,
    includesFree: (links: number, services: number) => [
      "Your own profile page",
      `Up to ${links} links`,
      `Up to ${services} services with prices`,
      "QR code",
      "Save-contact button",
      "Total visits",
      "Designs from the catalogue",
    ],
    includesPremium: (services: number) => [
      "Unlimited links",
      `Up to ${services} services with prices`,
      "Full analytics — by day and by link",
      "Contacts collected, and an Excel export",
      "Your own cover image",
      "Gold finish",
      "The Flex mark is removed from the page",
    ],
  },
} as const;

export type CatalogueDict = (typeof CATALOGUE)["uz"];

export function catalogue(lang: Lang): CatalogueDict {
  return CATALOGUE[lang] as CatalogueDict;
}


// --- the venue product ---------------------------------------------------
//
// Cafes, hotels and the rest of the service businesses. Kept whole rather than
// split across the page, because a claim about what a restaurant gets has to be
// the same claim in all three languages — the earlier split copy is exactly how
// a page ends up true in Uzbek and wrong in Russian.
//
// Prices, bands and the point limit stay in venues.ts. A price is not a
// translation.

const B2B = {
  uz: {
    metaTitle: "Biznes uchun — flex.com.uz",
    metaDescription:
      "Kafe, restoran va mehmonxonalar uchun NFC: menyu, xona xizmatlari, so'rovlar va statistika. Bir panel, uch til.",
    eyebrow: "Biznes uchun",
    title: "NFC — endi biznes uchun ham",
    lede: "Kafe, mehmonxona va boshqa xizmat obyektlari uchun. Mehmon telefonini tegizadi — kerakli sahifa ochiladi. Hech kim ilova o'rnatmaydi.",
    chainNow: "bugun",
    chainNext: "ertaga",
    chain: [
      "NFC → shaxsiy profil",
      "NFC → menyu",
      "NFC → mehmonxona xonasi",
      "NFC → kassa va rekvizit",
    ],
    pilotTitle: "Ishlab turibdi — hozir ochib ko'ring",
    pilotBody:
      "Kafe va mehmonxona modullari tayyor: menyu yoki xizmatlar ro'yxati, har stol va xonaga alohida QR va NFC, mehmondan keladigan chaqiruv, kassa telefonida ovozli ro'yxat va hisobot. Quyidagi demo — haqiqiy obyekt, telefoningizda oching.",
    pilotCta: "Demo menyuni ochish",

    coreEyebrow: "Qanday ishlaydi",
    coreTitle: "Bitta obyekt, ko'p nuqta",
    coreLede:
      "Nuqta — stol, xona, eshik yoki kabinet. Har birining o'z NFC belgisi va o'z sahifasi bo'ladi, hammasi bitta paneldan boshqariladi.",
    core: [
      {
        title: "Nuqta",
        desc: "Stol 1–20, xona 101–250, eshik, basseyn. Har biri alohida manzil — qaysi biridan kelinganini o'zi biladi.",
      },
      {
        title: "So'rovlar qutisi",
        desc: "Ofitsiantni chaqirish, xona tozalash, izoh. So'rov qaysi nuqtadan kelgani biriktiriladi va Telegram'ga tushadi.",
      },
      {
        title: "Hisobot",
        desc: "O'rtacha necha daqiqada javob berilgan, eng uzoq kim kutgan, qaysi stol ko'p chaqirgan va qaysi soatlarda gavjum.",
      },
    ],

    pickVertical: "Yo'nalishni tanlang",
    guestSide: "Mehmon ko'radi",
    ownerSide: "Egasi ko'radi",
    staffSide: "Xodim ishlatadi",
    whyPay: "Nega to'laydi",

    verticals: {
      cafe: {
        name: "Kafe va restoran",
        pointWord: "stol",
        pointsWord: "stol",
        tagline: "Stol ustidagi taglik yoki stikerda NFC va QR",
        guest: [
          "Menyu: bo'limlar, rasm, narx, tarkib va allergenlar",
          "«Tugadi» — taom bir tugma bilan yopiladi",
          "O'zbekcha, ruscha, inglizcha",
          "Ofitsiantni chaqirish",
          "Hisobni so'rash",
          "Baho va izoh qoldirish",
          "Wi-Fi parolini NFC orqali olish",
        ],
        owner: [
          "Menyu muharriri — narx bir daqiqada o'zgaradi",
          "Stop-list: bugun yo'q taomlar",
          "Har bir stol bo'yicha statistika",
          "Izohlar qutisi",
          "Chaqiruv va izoh Telegram'ga tushadi",
        ],
        staff: [],
        why: [
          "Menyu narxi o'zgarsa qayta chop etiladi — dizayn, bosma, kutish. Bu yerda narx o'zgarishi bepul va bir daqiqa.",
          "Norozi mehmon izohni Google yoki Yandex xaritasiga yozadi va u o'sha yerda qoladi. Bu yerda izoh avval egasiga keladi — muammoni mehmon ketguncha hal qilish imkoni bo'ladi.",
        ],
      },
      hotel: {
        name: "Mehmonxona",
        pointWord: "xona",
        pointsWord: "xona",
        tagline: "Xonadagi taglik yoki eshikdagi teg — charm papkani almashtiradi",
        guest: [
          "Wi-Fi paroli — NFC bilan o'zi ulanadi",
          "Chiqish vaqti, nonushta vaqti",
          "Room service menyusi",
          "Xona tozalash so'rovi",
          "Kir yuvish, taksi, uyg'otish",
          "Shahar bo'yicha yo'riqnoma — uch tilda",
        ],
        owner: [
          "So'rovlar qutisi — xona raqami o'zi biriktiriladi",
          "Bajarildi / kutmoqda holati",
          "Restoran va spa bronlari",
          "Xona bo'yicha statistika",
        ],
        staff: [
          "Farrosh eshikdagi tegga tegizadi — xona «tozalangan» bo'lib belgilanadi, vaqti bilan",
          "Qog'oz varaq ham, alohida qurilma ham kerak emas",
        ],
        why: [
          "Chet ellik mehmonga ruscha va inglizcha kerak — uchala til allaqachon ishlaydi. Bosma papka esa har mavsumda eskiradi.",
          "Qurilma faqat mehmon uchun emas: ichki jarayon uchun ham ishlaydi, ya'ni bitta xarid ikki ish qiladi.",
        ],
      },
      shop: {
        name: "Savdo do'koni",
        pointWord: "nuqta",
        pointsWord: "nuqta",
        tagline: "Eshik oldida yoki kassada — o'zingiz tanlaysiz",
        guest: [
          "To'lov: Click, Payme yoki karta raqami — bir tegishda",
          "Firma rekvizitlari: STIR, hisob raqami, bank — nusxa olinadi",
          "Tovarlar katalogi: rasm, narx, mavjudligi",
          "Ish vaqti, manzil va xaritada yo'l",
          "Izoh va baho qoldirish",
        ],
        owner: [
          "Narx va mavjudlikni o'zingiz tahrirlaysiz",
          "«Tugadi» — tovar bir tugma bilan yopiladi",
          "Nuqta bo'yicha statistika: eshikdanmi yoki kassadanmi",
          "Izohlar qutisi",
        ],
        staff: [],
        why: [
          "Kassada karta raqamini qo'lda aytish yoki qog'ozga yozib qo'yish — xato va vaqt. Bu yerda xaridor tegizadi va to'lov ochiladi.",
          "Rekvizitni so'ragan firmaga har safar qayta yozib bermaysiz: nusxa olish tugmasi bor, xato ketmaydi.",
        ],
      },
      other: {
        name: "Boshqa obyektlar",
        pointWord: "nuqta",
        pointsWord: "nuqta",
        tagline: "Salon, klinika, muzey va boshqalar — shakl o'sha, sahifa boshqacha",
        guest: [
          "Xizmatlar va narxlar ro'yxati",
          "Mutaxassis profili va ishlari",
          "Yozilish so'rovi",
          "Izoh va baho",
          "Uch tilda",
        ],
        owner: [
          "Narx va matnni o'zingiz tahrirlaysiz",
          "So'rovlar qutisi",
          "Nuqta bo'yicha statistika",
        ],
        staff: [],
        why: [
          "Sizning yo'nalishingiz ro'yxatda yo'qmi — so'rov qoldiring. Shakl bitta: buyumga tegiziladi, sahifa ochiladi, bitta ish bajariladi.",
        ],
      },
    },

    otherEyebrow: "Yana qayerda",
    otherTitle: "Boshqa xizmat obyektlari",
    otherLede:
      "Mezon bitta: «buyumga tegiziladi → sahifa ochiladi va bitta ish bajariladi» degan shakl o'sha yerda haqiqiy muammoni yechadimi.",
    tableHead: ["Yo'nalish", "Nuqta", "Nima qiladi"],
    others: [
      ["Go'zallik saloni, sartaroshxona", "Usta o'rindig'i", "Narxlar, ustaga yozilish, ishlari, izohlar"],
      ["Klinika, stomatologiya", "Shifokor eshigi", "Shifokor profili, narx, navbat, tayyorgarlik"],
      ["Muzey, turistik joy", "Eksponat lavhasi", "Uch tilda matn va audio yo'riqnoma"],
      ["Ko'chmas mulk agentligi", "Obyektdagi lavha", "E'lon, rasmlar, agent kontakti"],
      ["Fitnes klub", "Trenajyor, murabbiy", "Mashq videosi, murabbiyga yozilish"],
      ["Biznes markaz", "Yig'ilish xonasi eshigi", "Xona bandmi, hozir band qilish"],
    ],

    priceEyebrow: "Narx",
    priceTitle: "O'rin emas, obyekt",
    priceLede:
      "To'lov obyekt bo'yicha, nuqta soniga qarab pog'onalanadi. Qurilmalar (taglik, stiker, teg) alohida va bir martalik.",
    pointsLabel: "Nuqtalar soni",
    monthlyWord: "oyiga",
    perPointWord: "bitta nuqtaga",
    negotiated: "Kelishuv bo'yicha",
    negotiatedNote: "Tarmoq yoki katta obyekt — narxni suhbatda aniqlaymiz.",
    bandNames: ["15 nuqtagacha", "40 nuqtagacha", "40 dan ortiq"],
    askForThis: "Shu bo'yicha so'rov qoldirish",

    formEyebrow: "So'rov",
    formTitle: "Obyektingiz uchun hisob-kitob",
    formLede: "Bir ish kuni ichida bog'lanamiz.",
    fields: {
      vertical: "Yo'nalish",
      company: "Obyekt nomi",
      companyHint: "Kafe, restoran yoki mehmonxona nomi",
      points: "Nuqtalar soni",
      contactName: "Ismingiz",
      phone: "Telefon",
      email: "Elektron pochta — ixtiyoriy",
      note: "Izoh — ixtiyoriy",
      noteHint: "Qanday qurilma, qachonga kerak, qo'shimcha savol",
    },
    submit: "So'rov yuborish",
    sending: "Yuborilmoqda…",
    sentTitle: "Qabul qilindi",
    sentBody: "Bir ish kuni ichida bog'lanamiz. Shoshilinch bo'lsa qo'ng'iroq qiling:",
    errors: {
      company: "Obyekt nomini kiriting.",
      name: "Ismingizni kiriting.",
      phone: "Telefon raqamini to'liq kiriting.",
      email: "Elektron pochta manzili noto'g'ri.",
      points: "Nechta nuqta ekanini kiriting.",
      pointsBig: "Bu son juda katta — tekshirib qayta kiriting.",
      note: "Izoh juda uzun.",
      save: "Hozir saqlab bo'lmadi. Qo'ng'iroq qiling:",
    },

    teamEyebrow: "Yana bir yo'nalish",
    teamTitle: "Xodimlar uchun kartalar",
    teamBody:
      "Obyekt emas, jamoa kerakmi — xodimlaringizga bir xil brend bilan raqam va NFC karta chiqaramiz.",
    teamCta: "Jamoa tarifini ko'rish",
  },

  ru: {
    metaTitle: "Для бизнеса — flex.com.uz",
    metaDescription:
      "NFC для кафе, ресторанов и отелей: меню, обслуживание в номере, запросы и статистика. Одна панель, три языка.",
    eyebrow: "Для бизнеса",
    title: "NFC — теперь и для бизнеса",
    lede: "Для кафе, отелей и других сервисных объектов. Гость подносит телефон — открывается нужная страница. Приложение никому ставить не нужно.",
    chainNow: "сегодня",
    chainNext: "завтра",
    chain: [
      "NFC → личный профиль",
      "NFC → меню",
      "NFC → номер отеля",
      "NFC → касса и реквизиты",
    ],
    pilotTitle: "Уже работает — откройте прямо сейчас",
    pilotBody:
      "Модули для кафе и отелей готовы: меню или список услуг, отдельный QR и NFC на каждый стол и номер, вызов от гостя, список со звуком на телефоне у кассы и отчёт. Демо ниже — настоящий объект, откройте на телефоне.",
    pilotCta: "Открыть демо-меню",

    coreEyebrow: "Как работает",
    coreTitle: "Один объект, много точек",
    coreLede:
      "Точка — это стол, номер, дверь или кабинет. У каждой свой NFC-знак и своя страница, всё управляется из одной панели.",
    core: [
      {
        title: "Точка",
        desc: "Стол 1–20, номер 101–250, дверь, бассейн. У каждой свой адрес — система сама знает, откуда пришли.",
      },
      {
        title: "Ящик запросов",
        desc: "Позвать официанта, убрать номер, оставить отзыв. К запросу сама подставляется точка, и он приходит в Telegram.",
      },
      {
        title: "Отчёт",
        desc: "За сколько минут в среднем отвечают, кто ждал дольше всех, какой стол зовёт чаще и в какие часы наплыв.",
      },
    ],

    pickVertical: "Выберите направление",
    guestSide: "Видит гость",
    ownerSide: "Видит владелец",
    staffSide: "Использует персонал",
    whyPay: "Почему платят",

    verticals: {
      cafe: {
        name: "Кафе и ресторан",
        pointWord: "стол",
        pointsWord: "столов",
        tagline: "NFC и QR на подставке или наклейке на столе",
        guest: [
          "Меню: разделы, фото, цена, состав и аллергены",
          "«Закончилось» — блюдо скрывается одной кнопкой",
          "Узбекский, русский, английский",
          "Позвать официанта",
          "Попросить счёт",
          "Оставить оценку и отзыв",
          "Пароль Wi-Fi через NFC",
        ],
        owner: [
          "Редактор меню — цена меняется за минуту",
          "Стоп-лист: чего сегодня нет",
          "Статистика по каждому столу",
          "Ящик отзывов",
          "Вызовы и отзывы приходят в Telegram",
        ],
        staff: [],
        why: [
          "При смене цены меню печатают заново — дизайн, типография, ожидание. Здесь смена цены бесплатна и занимает минуту.",
          "Недовольный гость пишет отзыв в Google или Яндекс.Картах, и он там остаётся. Здесь отзыв сначала приходит владельцу — проблему можно решить, пока гость ещё не ушёл.",
        ],
      },
      hotel: {
        name: "Отель",
        pointWord: "номер",
        pointsWord: "номеров",
        tagline: "Подставка в номере или тег на двери — вместо кожаной папки",
        guest: [
          "Пароль Wi-Fi — подключает сам через NFC",
          "Время выезда, время завтрака",
          "Меню room service",
          "Запрос на уборку номера",
          "Прачечная, такси, будильник",
          "Путеводитель по городу — на трёх языках",
        ],
        owner: [
          "Ящик запросов — номер комнаты подставляется сам",
          "Статус: выполнено / в ожидании",
          "Брони ресторана и спа",
          "Статистика по номерам",
        ],
        staff: [
          "Горничная подносит телефон к тегу на двери — номер отмечается убранным, со временем",
          "Ни бумажного листа, ни отдельного устройства",
        ],
        why: [
          "Иностранному гостю нужны русский и английский — все три языка уже работают. Печатная папка устаревает каждый сезон.",
          "Устройство работает не только для гостя, но и для внутреннего процесса: одна покупка делает две работы.",
        ],
      },
      shop: {
        name: "Магазин",
        pointWord: "точка",
        pointsWord: "точек",
        tagline: "У двери или на кассе — как вам удобнее",
        guest: [
          "Оплата: Click, Payme или номер карты — одним касанием",
          "Реквизиты компании: ИНН, расчётный счёт, банк — копируются",
          "Каталог товаров: фото, цена, наличие",
          "Часы работы, адрес и маршрут на карте",
          "Отзыв и оценка",
        ],
        owner: [
          "Цены и наличие редактируете сами",
          "«Закончилось» — товар скрывается одной кнопкой",
          "Статистика по точкам: от двери или от кассы",
          "Ящик отзывов",
        ],
        staff: [],
        why: [
          "Диктовать номер карты на кассе или держать его на бумажке — это ошибки и время. Здесь покупатель подносит телефон и открывается оплата.",
          "Реквизиты не приходится каждый раз переписывать: есть кнопка копирования, и в них не будет опечатки.",
        ],
      },
      other: {
        name: "Другие объекты",
        pointWord: "точка",
        pointsWord: "точек",
        tagline: "Салон, клиника, музей и другие — форма та же, страница другая",
        guest: [
          "Список услуг и цен",
          "Профиль специалиста и его работы",
          "Запрос на запись",
          "Отзыв и оценка",
          "На трёх языках",
        ],
        owner: [
          "Цены и тексты редактируете сами",
          "Ящик запросов",
          "Статистика по точкам",
        ],
        staff: [],
        why: [
          "Вашего направления нет в списке — оставьте заявку. Форма одна: поднесли к предмету, открылась страница, сделалось одно дело.",
        ],
      },
    },

    otherEyebrow: "Где ещё",
    otherTitle: "Другие сервисные объекты",
    otherLede:
      "Критерий один: решает ли форма «поднёс к предмету → открылась страница и сделалось одно дело» настоящую проблему в этом месте.",
    tableHead: ["Направление", "Точка", "Что делает"],
    others: [
      ["Салон красоты, барбершоп", "Кресло мастера", "Цены, запись к мастеру, работы, отзывы"],
      ["Клиника, стоматология", "Дверь врача", "Профиль врача, цены, запись, подготовка"],
      ["Музей, туристический объект", "Табличка у экспоната", "Текст и аудиогид на трёх языках"],
      ["Агентство недвижимости", "Табличка на объекте", "Объявление, фото, контакт агента"],
      ["Фитнес-клуб", "Тренажёр, тренер", "Видео упражнения, запись к тренеру"],
      ["Бизнес-центр", "Дверь переговорной", "Занята ли комната, забронировать сейчас"],
    ],

    priceEyebrow: "Цена",
    priceTitle: "Не место, а объект",
    priceLede:
      "Оплата за объект, ступенями по числу точек. Устройства (подставки, наклейки, теги) отдельно и единоразово.",
    pointsLabel: "Число точек",
    monthlyWord: "в месяц",
    perPointWord: "за одну точку",
    negotiated: "По договорённости",
    negotiatedNote: "Сеть или крупный объект — цену определим в разговоре.",
    bandNames: ["до 15 точек", "до 40 точек", "больше 40"],
    askForThis: "Оставить заявку по этому варианту",

    formEyebrow: "Заявка",
    formTitle: "Расчёт для вашего объекта",
    formLede: "Свяжемся в течение рабочего дня.",
    fields: {
      vertical: "Направление",
      company: "Название объекта",
      companyHint: "Название кафе, ресторана или отеля",
      points: "Число точек",
      contactName: "Ваше имя",
      phone: "Телефон",
      email: "Электронная почта — необязательно",
      note: "Комментарий — необязательно",
      noteHint: "Какие устройства, к какому сроку, дополнительные вопросы",
    },
    submit: "Отправить заявку",
    sending: "Отправляется…",
    sentTitle: "Принято",
    sentBody: "Свяжемся в течение рабочего дня. Если срочно — позвоните:",
    errors: {
      company: "Укажите название объекта.",
      name: "Укажите ваше имя.",
      phone: "Введите телефон полностью.",
      email: "Неверный адрес электронной почты.",
      points: "Укажите число точек.",
      pointsBig: "Слишком большое число — проверьте и введите заново.",
      note: "Комментарий слишком длинный.",
      save: "Сейчас не удалось сохранить. Позвоните:",
    },

    teamEyebrow: "Ещё одно направление",
    teamTitle: "Карты для сотрудников",
    teamBody:
      "Нужен не объект, а команда — выпустим сотрудникам номера и NFC-карты в едином фирменном стиле.",
    teamCta: "Посмотреть тариф для команды",
  },

  en: {
    metaTitle: "For business — flex.com.uz",
    metaDescription:
      "NFC for cafes, restaurants and hotels: menus, in-room service, requests and statistics. One panel, three languages.",
    eyebrow: "For business",
    title: "NFC — now for business too",
    lede: "For cafes, hotels and other service venues. A guest taps their phone and the right page opens. Nobody installs an app.",
    chainNow: "today",
    chainNext: "next",
    chain: [
      "NFC → personal profile",
      "NFC → menu",
      "NFC → hotel room",
      "NFC → till and company details",
    ],
    pilotTitle: "It is running — open it now",
    pilotBody:
      "The cafe and hotel modules are ready: a menu or a service list, a separate QR and NFC tag for every table and room, a call from the guest, a list that makes a noise on the phone by the till, and a report. The demo below is a real venue — open it on your phone.",
    pilotCta: "Open the demo menu",

    coreEyebrow: "How it works",
    coreTitle: "One venue, many points",
    coreLede:
      "A point is a table, a room, a door or a treatment room. Each gets its own NFC marker and its own page, all edited from one panel.",
    core: [
      {
        title: "Points",
        desc: "Table 1–20, room 101–250, a door, the pool. Each is its own address, so the system knows where a visit came from.",
      },
      {
        title: "Request inbox",
        desc: "Call a waiter, request housekeeping, leave a review. The point is attached automatically and it arrives in Telegram.",
      },
      {
        title: "Report",
        desc: "How many minutes a call waits on average, who waited longest, which table calls most, and which hours are busy.",
      },
    ],

    pickVertical: "Pick a direction",
    guestSide: "The guest sees",
    ownerSide: "The owner sees",
    staffSide: "Staff use",
    whyPay: "Why they pay",

    verticals: {
      cafe: {
        name: "Cafe and restaurant",
        pointWord: "table",
        pointsWord: "tables",
        tagline: "NFC and QR on a table stand or a sticker",
        guest: [
          "Menu: sections, photos, prices, ingredients and allergens",
          "“Sold out” — a dish is hidden with one button",
          "Uzbek, Russian, English",
          "Call a waiter",
          "Ask for the bill",
          "Leave a rating and a review",
          "Wi-Fi password over NFC",
        ],
        owner: [
          "Menu editor — a price changes in a minute",
          "Stop list: what is off today",
          "Statistics for every table",
          "Review inbox",
          "Calls and reviews arrive in Telegram",
        ],
        staff: [],
        why: [
          "A price change means reprinting the menu — design, print, waiting. Here a price change is free and takes a minute.",
          "An unhappy guest writes the review on Google or Yandex Maps and it stays there. Here the review reaches the owner first, while the guest is still in the room.",
        ],
      },
      hotel: {
        name: "Hotel",
        pointWord: "room",
        pointsWord: "rooms",
        tagline: "A stand in the room or a tag on the door — in place of the leather compendium",
        guest: [
          "Wi-Fi password — NFC connects the phone itself",
          "Checkout time, breakfast time",
          "Room service menu",
          "Housekeeping request",
          "Laundry, taxi, wake-up call",
          "A city guide — in three languages",
        ],
        owner: [
          "Request inbox — the room number attaches itself",
          "Done / waiting status",
          "Restaurant and spa bookings",
          "Statistics by room",
        ],
        staff: [
          "Housekeeping taps the tag on the door — the room is marked serviced, with the time",
          "No paper sheet and no separate handheld",
        ],
        why: [
          "A foreign guest needs Russian and English — all three languages already work. A printed compendium goes stale every season.",
          "The hardware is not only for the guest: it serves an internal process too, so one purchase does two jobs.",
        ],
      },
      shop: {
        name: "Shop",
        pointWord: "point",
        pointsWord: "points",
        tagline: "By the door or at the till — whichever suits you",
        guest: [
          "Payment: Click, Payme or a card number — in one tap",
          "Company details: tax number, account, bank — copied, not retyped",
          "The catalogue: photo, price, whether it is in stock",
          "Opening hours, the address and directions",
          "Leave a review and a rating",
        ],
        owner: [
          "You edit prices and stock yourself",
          "“Sold out” — an item is hidden with one button",
          "Statistics per point: from the door or from the till",
          "Review inbox",
        ],
        staff: [],
        why: [
          "Reading a card number aloud at the till, or keeping it on a slip of paper, costs time and produces mistakes. Here the customer taps and the payment opens.",
          "Company details stop being retyped for every buyer who asks: there is a copy button, and nothing gets a digit wrong.",
        ],
      },
      other: {
        name: "Other venues",
        pointWord: "point",
        pointsWord: "points",
        tagline: "Salons, clinics, museums and the rest — same shape, different page",
        guest: [
          "Services and prices",
          "The specialist's profile and their work",
          "Booking request",
          "Review and rating",
          "In three languages",
        ],
        owner: [
          "You edit the prices and the text yourself",
          "Request inbox",
          "Statistics by point",
        ],
        staff: [],
        why: [
          "If your line of work is not on the list, send an enquiry. The shape is one: tap an object, a page opens, one job gets done.",
        ],
      },
    },

    otherEyebrow: "Where else",
    otherTitle: "Other service venues",
    otherLede:
      "One test: does the shape — tap an object, a page opens, one job gets done — solve a real problem in that place.",
    tableHead: ["Direction", "Point", "What it does"],
    others: [
      ["Beauty salon, barbershop", "The stylist's chair", "Prices, booking a stylist, their work, reviews"],
      ["Clinic, dental practice", "The doctor's door", "Doctor profile, prices, booking, preparation"],
      ["Museum, heritage site", "The label by the exhibit", "Text and audio guide in three languages"],
      ["Estate agency", "The plaque on the property", "The listing, photos, the agent's contact"],
      ["Gym", "A machine, a trainer", "How to use it on video, booking a trainer"],
      ["Business centre", "The meeting room door", "Whether it is booked, book it now"],
    ],

    priceEyebrow: "Price",
    priceTitle: "Not a seat, a venue",
    priceLede:
      "Billed per venue, in bands by the number of points. Hardware (stands, stickers, tags) is separate and one-time.",
    pointsLabel: "Number of points",
    monthlyWord: "a month",
    perPointWord: "per point",
    negotiated: "By agreement",
    negotiatedNote: "A chain or a large venue — we settle the price in conversation.",
    bandNames: ["up to 15 points", "up to 40 points", "more than 40"],
    askForThis: "Enquire about this",

    formEyebrow: "Enquiry",
    formTitle: "A quote for your venue",
    formLede: "We reply within one working day.",
    fields: {
      vertical: "Direction",
      company: "Venue name",
      companyHint: "The name of the cafe, restaurant or hotel",
      points: "Number of points",
      contactName: "Your name",
      phone: "Phone",
      email: "Email — optional",
      note: "Note — optional",
      noteHint: "Which hardware, by when, anything else you want to ask",
    },
    submit: "Send the enquiry",
    sending: "Sending…",
    sentTitle: "Received",
    sentBody: "We reply within one working day. If it is urgent, call:",
    errors: {
      company: "Enter the venue name.",
      name: "Enter your name.",
      phone: "Enter the phone number in full.",
      email: "That email address is not valid.",
      points: "Enter how many points there are.",
      pointsBig: "That number is too large — check it and enter it again.",
      note: "The note is too long.",
      save: "That could not be saved just now. Please call:",
    },

    teamEyebrow: "One more direction",
    teamTitle: "Cards for staff",
    teamBody:
      "If you need a team rather than a venue — we issue your staff numbers and NFC cards in one house style.",
    teamCta: "See the team plan",
  },
} as const;

export type B2BDict = (typeof B2B)["uz"];

export function b2b(lang: Lang): B2BDict {
  return B2B[lang] as B2BDict;
}


// --- what a venue's own page looks like ----------------------------------
//
// The landing page described the personal profile in prose for months before
// anybody drew it, and the section that finally showed it is the one that
// explains the product fastest. A cafe owner reading "menyu, narx, allergen"
// is in exactly that position, so the venue page shows the screen instead.
//
// One shape for all three so a single component can draw them: a name, a point,
// some chips, rows of [name, note, right-hand value], a small grid of actions
// and two buttons. The content is a plausible venue, not a real customer.

type Screen = {
  venue: string;
  point: string;
  chips: readonly string[];
  rows: readonly (readonly [string, string, string])[];
  actions: readonly string[];
  primary: string;
  secondary: string;
};

const SCREENS: Record<Lang, Record<"cafe" | "hotel" | "shop" | "other", Screen>> = {
  uz: {
    cafe: {
      venue: "Choyxona Navro'z",
      point: "Stol 7",
      chips: ["Salatlar", "Issiq taomlar", "Ichimlik"],
      rows: [
        ["Lag'mon", "Qo'l uzilgan, o'tkir", "38 000"],
        ["Achichuk salat", "Pomidor, piyoz, rayhon", "18 000"],
        ["Choy — ko'k", "Choynak, 1 litr", "9 000"],
      ],
      actions: [],
      primary: "Ofitsiantni chaqirish",
      secondary: "Hisobni so'rash",
    },
    hotel: {
      venue: "Hotel Registon",
      point: "Xona 214",
      chips: ["Wi-Fi — bir tegishda"],
      rows: [
        ["Chiqish vaqti", "", "12:00"],
        ["Nonushta", "Restoran, 2-qavat", "07:00 – 10:00"],
        ["Room service", "Kechayu kunduz", "24/7"],
      ],
      actions: ["Xonani tozalash", "Kir yuvish", "Taksi", "Uyg'otish"],
      primary: "So'rov yuborish",
      secondary: "Shahar bo'yicha yo'riqnoma",
    },
    shop: {
      venue: "Anor Market",
      point: "Kassa",
      chips: ["Har kuni 08:00 – 22:00"],
      rows: [
        ["Click orqali to'lash", "Summani o'zingiz kiritasiz", ""],
        ["Payme orqali to'lash", "", ""],
        ["Karta raqami", "8600 •••• •••• 1234", "Nusxa"],
      ],
      actions: ["Firma rekvizitlari", "Tovarlar katalogi"],
      primary: "To'lash",
      secondary: "Izoh qoldirish",
    },
    other: {
      venue: "Salon Nilufar",
      point: "Usta 3",
      chips: ["Dilnoza R. · stilist, 6 yil"],
      rows: [
        ["Soch turmagi", "Yuvish bilan", "120 000"],
        ["Bo'yash", "Uzunligiga qarab", "350 000"],
        ["Manikyur", "Gel-lak", "150 000"],
      ],
      actions: [],
      primary: "Yozilish",
      secondary: "Izohlar · 4,9 ★",
    },
  },

  ru: {
    cafe: {
      venue: "Чайхана Навруз",
      point: "Стол 7",
      chips: ["Салаты", "Горячее", "Напитки"],
      rows: [
        ["Лагман", "Тянутый, острый", "38 000"],
        ["Салат ачичук", "Помидор, лук, базилик", "18 000"],
        ["Чай зелёный", "Чайник, 1 литр", "9 000"],
      ],
      actions: [],
      primary: "Позвать официанта",
      secondary: "Попросить счёт",
    },
    hotel: {
      venue: "Hotel Registon",
      point: "Номер 214",
      chips: ["Wi-Fi — одним касанием"],
      rows: [
        ["Время выезда", "", "12:00"],
        ["Завтрак", "Ресторан, 2 этаж", "07:00 – 10:00"],
        ["Room service", "Круглосуточно", "24/7"],
      ],
      actions: ["Уборка номера", "Прачечная", "Такси", "Разбудить"],
      primary: "Отправить запрос",
      secondary: "Путеводитель по городу",
    },
    shop: {
      venue: "Anor Market",
      point: "Касса",
      chips: ["Ежедневно 08:00 – 22:00"],
      rows: [
        ["Оплатить через Click", "Сумму вводите сами", ""],
        ["Оплатить через Payme", "", ""],
        ["Номер карты", "8600 •••• •••• 1234", "Копия"],
      ],
      actions: ["Реквизиты компании", "Каталог товаров"],
      primary: "Оплатить",
      secondary: "Оставить отзыв",
    },
    other: {
      venue: "Салон Нилуфар",
      point: "Мастер 3",
      chips: ["Дилноза Р. · стилист, 6 лет"],
      rows: [
        ["Стрижка", "С мытьём головы", "120 000"],
        ["Окрашивание", "По длине волос", "350 000"],
        ["Маникюр", "Гель-лак", "150 000"],
      ],
      actions: [],
      primary: "Записаться",
      secondary: "Отзывы · 4,9 ★",
    },
  },

  en: {
    cafe: {
      venue: "Navro'z Teahouse",
      point: "Table 7",
      chips: ["Salads", "Hot dishes", "Drinks"],
      rows: [
        ["Lagman", "Hand-pulled, spicy", "38 000"],
        ["Achichuk salad", "Tomato, onion, basil", "18 000"],
        ["Green tea", "Pot, 1 litre", "9 000"],
      ],
      actions: [],
      primary: "Call a waiter",
      secondary: "Ask for the bill",
    },
    hotel: {
      venue: "Hotel Registon",
      point: "Room 214",
      chips: ["Wi-Fi — one tap"],
      rows: [
        ["Checkout", "", "12:00"],
        ["Breakfast", "Restaurant, 2nd floor", "07:00 – 10:00"],
        ["Room service", "Round the clock", "24/7"],
      ],
      actions: ["Housekeeping", "Laundry", "Taxi", "Wake-up call"],
      primary: "Send the request",
      secondary: "City guide",
    },
    shop: {
      venue: "Anor Market",
      point: "Till",
      chips: ["Every day 08:00 – 22:00"],
      rows: [
        ["Pay with Click", "You enter the amount", ""],
        ["Pay with Payme", "", ""],
        ["Card number", "8600 •••• •••• 1234", "Copy"],
      ],
      actions: ["Company details", "Catalogue"],
      primary: "Pay",
      secondary: "Leave a review",
    },
    other: {
      venue: "Nilufar Salon",
      point: "Chair 3",
      chips: ["Dilnoza R. · stylist, 6 years"],
      rows: [
        ["Cut", "Wash included", "120 000"],
        ["Colour", "By hair length", "350 000"],
        ["Manicure", "Gel polish", "150 000"],
      ],
      actions: [],
      primary: "Book",
      secondary: "Reviews · 4.9 ★",
    },
  },
};

export type VenueScreenDict = Screen;

export function venueScreen(lang: Lang, vertical: "cafe" | "hotel" | "shop" | "other"): Screen {
  return SCREENS[lang][vertical];
}


// --- the picker ----------------------------------------------------------
//
// Everything Flex sells, as things you look at and choose between rather than
// paragraphs you read. The owner asked for it in the shape of a game's loadout
// screen, and the comparison is exact: a person picking a card over a ring is
// making a taste decision, and taste decisions are made from pictures.
//
// Prices stay in devices.ts. Names and descriptions for the three devices stay
// in the catalogue above — repeating them here would be two places to change a
// product name and one of them would be missed.

const PICKER = {
  uz: {
    metaTitle: "Tanlang — flex.com.uz",
    metaDescription:
      "Flex qurilmalari va yo'nalishlari: karta, uzuk, braslet, avtovizitka; kafe, mehmonxona va do'kon uchun NFC.",
    title: "Nimani tanlaysiz?",
    lead: "Raqamingizni qaysi buyumda olib yurasiz, yoki qaysi yo'nalishda ishlatasiz. Rasmni bosing — ichida hammasi bor.",
    groupDevices: "Qurilmalar",
    groupDevicesNote: "Bittasini tanlaysiz, keyin ham almashtira olasiz",
    groupDirections: "Yo'nalishlar",
    groupDirectionsNote: "Obyektingiz uchun",
    askPrice: "Narxni so'rash",
    orderForHandle: "Buyurtma berish",
    orderPickHandle: "Kabinetda raqamni tanlang",
    orderCta: "Buyurtma qilish",
    openCta: "Ochish",
    includesLabel: "Nimalar kiradi",
    back: "Hammasi",
    priceNote: "Bu qurilmaning narxi. Raqam alohida sotib olinadi.",
    priceUnknown: "Narx kelishuv bo'yicha",
    includes: [
      "NFC chip va QR-kod",
      "Katalogdagi dizaynlardan biri",
      "Raqamingiz o'yib yoziladi",
      "Toshkent bo'ylab yetkazib berish",
    ],
    // A plate on glass has no design catalogue and nothing engraved on it, so
    // it does not borrow the device list above.
    carIncludes: [
      "NFC chip va QR-kod",
      "Old oynaga yopishtiriladigan plastina",
      "Xabar Telegram'ingizga tushadi",
      "Telefon raqamingiz hech kimga ochilmaydi",
    ],
    avtovizitka: {
      name: "Avtovizitka",
      tagline: "Mashina old oynasida",
      description:
        "QR va NFC plastina. Yo'lda to'sib qo'ysangiz yoki faralar yoqiq qolsa — sizga xabar keladi, telefon raqamingiz esa ochilmaydi.",
    },
  },

  ru: {
    metaTitle: "Выбор — flex.com.uz",
    metaDescription:
      "Устройства и направления Flex: карта, кольцо, браслет, автовизитка; NFC для кафе, отелей и магазинов.",
    title: "Что выбираете?",
    lead: "В каком предмете носить номер или в каком направлении его использовать. Нажмите на картинку — внутри всё есть.",
    groupDevices: "Устройства",
    groupDevicesNote: "Выбираете одно, позже можно поменять",
    groupDirections: "Направления",
    groupDirectionsNote: "Для вашего объекта",
    askPrice: "Узнать цену",
    orderForHandle: "Заказать",
    orderPickHandle: "Выберите номер в кабинете",
    orderCta: "Заказать",
    openCta: "Открыть",
    includesLabel: "Что входит",
    back: "Все",
    priceNote: "Это цена устройства. Номер покупается отдельно.",
    priceUnknown: "Цена по договорённости",
    includes: [
      "NFC-чип и QR-код",
      "Один из дизайнов каталога",
      "Ваш номер наносится гравировкой",
      "Доставка по Ташкенту",
    ],
    carIncludes: [
      "NFC-чип и QR-код",
      "Пластина на лобовое стекло",
      "Сообщение приходит в ваш Telegram",
      "Ваш номер телефона никому не открывается",
    ],
    avtovizitka: {
      name: "Автовизитка",
      tagline: "На лобовом стекле",
      description:
        "QR и NFC-пластина. Перегородили проезд или у вас горят фары — вам напишут, а телефон останется закрытым.",
    },
  },

  en: {
    metaTitle: "Choose — flex.com.uz",
    metaDescription:
      "Flex devices and directions: card, ring, bracelet, car card; NFC for cafes, hotels and shops.",
    title: "What are you choosing?",
    lead: "Which object carries your number, or which direction you use it in. Tap a picture — everything is inside.",
    groupDevices: "Devices",
    groupDevicesNote: "Pick one; you can change it later",
    groupDirections: "Directions",
    groupDirectionsNote: "For your venue",
    askPrice: "Ask the price",
    orderForHandle: "Order one",
    orderPickHandle: "Pick a number in the cabinet",
    orderCta: "Order",
    openCta: "Open",
    includesLabel: "What's included",
    back: "All of them",
    priceNote: "This is the price of the device. The number is bought separately.",
    priceUnknown: "Price by agreement",
    includes: [
      "An NFC chip and a QR code",
      "One of the designs from the catalogue",
      "Your number engraved on it",
      "Delivery across Tashkent",
    ],
    carIncludes: [
      "An NFC chip and a QR code",
      "A plate for the windscreen",
      "The message arrives in your Telegram",
      "Your phone number is never revealed",
    ],
    avtovizitka: {
      name: "Car card",
      tagline: "On the windscreen",
      description:
        "A QR and NFC plate. Blocked someone in, or left your lights on, and they can reach you — while your phone number stays closed.",
    },
  },
} as const;

export type PickerDict = (typeof PICKER)["uz"];

export function picker(lang: Lang): PickerDict {
  return PICKER[lang] as PickerDict;
}

/**
 * The strings on the guest's request bar, and nothing else.
 *
 * The full site dictionary carries a few functions — `deviceNote`,
 * `handleCounts` — and a function cannot cross into a client component. The bar
 * is the first client component that wanted site copy, so it takes the subset it
 * uses, which is plain strings all the way down.
 */
export function menuBar(lang: Lang) {
  const s = site(lang);
  return {
    menuCallWaiter: s.menuCallWaiter,
    menuAskBill: s.menuAskBill,
    menuLeaveReview: s.menuLeaveReview,
    menuRequestSent: s.menuRequestSent,
    menuBillSent: s.menuBillSent,
    menuReviewSent: s.menuReviewSent,
    menuRequestTooSoon: s.menuRequestTooSoon,
    menuRequestFailed: s.menuRequestFailed,
    menuReviewPlaceholder: s.menuReviewPlaceholder,
    menuReviewSend: s.menuReviewSend,
    menuNoPoint: s.menuNoPoint,
  };
}

export type MenuBarDict = ReturnType<typeof menuBar>;
