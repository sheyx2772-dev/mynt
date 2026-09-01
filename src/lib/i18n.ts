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
  },
  ru: {
    call: "Позвонить",
    email: "Почта",
    address: "Адрес",
    meeting: "Встреча",
    website: "Сайт",
    saveContact: "Сохранить контакт",
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
  },
  en: {
    call: "Call",
    email: "Email",
    address: "Location",
    meeting: "Book a meeting",
    website: "Website",
    saveContact: "Save contact",
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
    getHandle: "Handle oling",
    signIn: "Kirish",
    footerTerms: "Ommaviy oferta",
    footerPlans: "Tariflar",
    footerDevices: "Qurilmalar",
    heroBadge: "Raqamli shaxsingiz. Bir tegish.",
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
    footerTagline: "Raqamli shaxsingiz. Bir tegish bilan ulashing.",
    personalProfile: "Shaxsiy profil",
    teamCards: "Jamoa kartalari",
    contactCollection: "Kontakt yig'ish",
    eventMode: "Tadbir rejimi",
    company: "Kompaniya",
    delivery: "Yetkazib berish va qaytarish shartlari",
    heroTitleA: "Flex — Sizning",
    heroTitleMark: "raqamli",
    heroTitleB: "dunyoingiz",
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
    tagline: "Sizning raqamli dunyoingiz",
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
    navFeed: "Lenta",
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
    heroBadge: "Ваша цифровая визитка. Одно касание.",
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
    footerTagline: "Ваша цифровая визитка. Делитесь одним касанием.",
    personalProfile: "Личный профиль",
    teamCards: "Карты для команды",
    contactCollection: "Сбор контактов",
    eventMode: "Режим мероприятия",
    company: "Компания",
    delivery: "Доставка и условия возврата",
    heroTitleA: "Flex — Ваш",
    heroTitleMark: "цифровой",
    heroTitleB: "мир",
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
    tagline: "Ваш цифровой мир",
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
    navFeed: "Лента",
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
    getHandle: "Get a handle",
    signIn: "Sign in",
    footerTerms: "Public offer",
    footerPlans: "Plans",
    footerDevices: "Devices",
    heroBadge: "Your digital identity. One tap.",
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
    footerTagline: "Your digital identity. Share it with one tap.",
    personalProfile: "Personal profile",
    teamCards: "Team cards",
    contactCollection: "Contact collection",
    eventMode: "Event mode",
    company: "Company",
    delivery: "Delivery and returns",
    heroTitleA: "Flex — Your",
    heroTitleMark: "digital",
    heroTitleB: "world",
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
    tagline: "Your digital world",
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
    navFeed: "Feed",
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
        q: "Handle nima va u qanday narxlanadi?",
        a: "Handle — 3 harf + 3 raqamdan iborat noyob kod (masalan MYN042), sizning shaxsiy profilingiz manzili bo'ladi. Narx bazaviy summadan, harflar va raqamlarning kamyobligiga qarab ko'payadigan koeffitsientlardan hisoblanadi. Yuqorida hisob-kitobni o'zingiz sinab ko'rishingiz mumkin.",
      },
      {
        q: "NFC qurilma qanday ishlaydi?",
        a: "Qurilmani (karta, uzuk yoki braslet) boshqa telefonga tegizganingizda, sizning flex.com.uz profilingiz avtomatik ochiladi. Hech kim ilova o'rnatmaydi. NFC qo'llamaydigan telefonlar uchun QR-kod zaxira variant sifatida ishlaydi.",
      },
      {
        q: "Biznes uchun qancha xodim qo'shsam bo'ladi?",
        a: "Jamoa tarifi o'rinlar bo'yicha sotiladi, eng kami 5 ta. O'rin odamga emas, firmaga tegishli: xodim ketsa o'rin bo'shaydi va keyingisiga beriladi.",
      },
      {
        q: "To'lovni qanday amalga oshiraman?",
        a: "Raqam va obuna uchun Click yoki Payme. Firmalar uchun hisob-faktura va bank o'tkazmasi — hujjatni kabinetdan o'zingiz olasiz.",
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
        a: "Номер — это уникальный код из 3 букв и 3 цифр (например MYN042), он становится адресом вашего профиля. Цена считается от базовой суммы с коэффициентами за редкость букв и цифр. Расчёт можно проверить выше.",
      },
      {
        q: "Как работает NFC-устройство?",
        a: "Подносите устройство (карту, кольцо или браслет) к чужому телефону — ваш профиль flex.com.uz открывается сам. Приложение никому ставить не нужно. Для телефонов без NFC есть QR-код.",
      },
      {
        q: "Сколько сотрудников можно добавить?",
        a: "Тариф для команды продаётся по местам, минимум 5. Место принадлежит компании, а не человеку: сотрудник уходит — место освобождается и переходит следующему.",
      },
      {
        q: "Как оплатить?",
        a: "Номер и подписку — через Click или Payme. Для компаний — счёт-фактура и банковский перевод, документ выдаётся прямо в кабинете.",
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
        q: "What is a handle and how is it priced?",
        a: "A handle is a unique code of three letters and three digits — MYN042, say — and it becomes the address of your profile. The price starts from a base and rises with how rare the letters and digits are. You can try the calculation above.",
      },
      {
        q: "How does the NFC device work?",
        a: "Hold the device — card, ring or bracelet — to somebody's phone and your flex.com.uz profile opens by itself. Nobody installs an app. Phones without NFC use the QR code instead.",
      },
      {
        q: "How many staff can I add?",
        a: "The team plan is sold by the seat, minimum five. A seat belongs to the company rather than to a person: when somebody leaves it frees up and goes to the next hire.",
      },
      {
        q: "How do I pay?",
        a: "Click or Payme for a handle and a subscription. Companies pay by invoice and bank transfer, and the document is issued in the cabinet.",
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
