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

export type Lang = "uz" | "ru";

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
    noPosts: "В этом профиле пока нет постов.",
  },
} as const;

export type Dict = (typeof STRINGS)["uz"];

export function dict(lang: Lang): Dict {
  return STRINGS[lang] as Dict;
}

export function isLang(value: unknown): value is Lang {
  return value === "uz" || value === "ru";
}

/**
 * Which language to render a profile in.
 *
 * An explicit choice in the address wins, because somebody who switched wants
 * it to stay switched and wants to be able to share the switched link. Failing
 * that, the browser's own preference — the visitor has already told their phone
 * what they read, and asking again is asking twice.
 *
 * Uzbek is the fallback rather than the browser's first choice, because a
 * browser set to English is not evidence that an English profile would help.
 */
export function pickLang(param: unknown, acceptLanguage: string | null): Lang {
  if (isLang(param)) return param;

  for (const part of (acceptLanguage ?? "").split(",")) {
    const tag = part.split(";")[0]!.trim().toLowerCase();
    if (tag.startsWith("uz")) return "uz";
    if (tag.startsWith("ru")) return "ru";
  }

  return DEFAULT_LANG;
}
