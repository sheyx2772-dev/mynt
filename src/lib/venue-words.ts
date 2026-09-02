import type { Lang } from "@/lib/i18n";
import type { RequestKind } from "@/lib/venue-requests";

// The same product, said in the customer's own words.
//
// A hotel is not a second system. A service list is a menu, a room number is a
// point, and "call a waiter" is "call staff" — the tables, the editor, the
// inbox and the guest page are all shared. What differs is every noun on the
// screen, and a guest who reads "Stol raqami" while standing in room 214 stops
// believing the thing was built for them.
//
// So the vocabulary is data, chosen by venues.kind, and there is exactly one of
// these per vertical we sell.

export type VenueKind = "cafe" | "hotel" | "shop" | "other";

export type VenueWords = {
  /** The heading over the list, and the tile in the cabinet. */
  listTitle: string;
  /** Nothing in the list yet. */
  listEmpty: string;
  /** One row of it: a dish, a service, a product. */
  itemWord: string;
  addItem: string;
  itemPlaceholder: string;
  /** The same example in the other two languages, for the optional fields. */
  itemPlaceholderRu: string;
  itemPlaceholderEn: string;
  categoryPlaceholder: string;
  notePlaceholder: string;
  /** Table, room, counter — what the tag was stuck to. */
  pointLabel: string;
  /** The screen where they are listed and printed. */
  pointsTitle: string;
  /** What one sticker says under the venue name. */
  pointPrefix: string;
  pointPlaceholder: string;
  /** Off the list today. */
  soldOut: string;
  /** Costs nothing, which a hotel's housekeeping generally does. */
  freeWord: string;
  /** The buttons on the guest's bar, in order. Two at most, plus the review. */
  actions: { kind: RequestKind; label: string; sent: string }[];
};

const CAFE: Record<Lang, VenueWords> = {
  uz: {
    listTitle: "Menyu",
    listEmpty: "Menyu hali to'ldirilmagan.",
    itemWord: "Taom",
    addItem: "Taom qo'shish",
    itemPlaceholder: "Lag'mon",
    itemPlaceholderRu: "Лагман",
    itemPlaceholderEn: "Lagman",
    categoryPlaceholder: "Issiq taomlar",
    notePlaceholder: "Qo'l uzilgan, o'tkir",
    pointLabel: "Stol raqami",
    pointsTitle: "Stollar",
    pointPrefix: "Stol",
    pointPlaceholder: "7",
    soldOut: "Bugun yo'q",
    freeWord: "Bepul",
    actions: [
      { kind: "waiter", label: "Ofitsiant", sent: "Yuborildi — hozir kelishadi." },
      { kind: "bill", label: "Hisob", sent: "Yuborildi — hisob tayyorlanmoqda." },
    ],
  },
  ru: {
    listTitle: "Меню",
    listEmpty: "Меню пока не заполнено.",
    itemWord: "Блюдо",
    addItem: "Добавить блюдо",
    itemPlaceholder: "Лагман",
    itemPlaceholderRu: "Лагман",
    itemPlaceholderEn: "Lagman",
    categoryPlaceholder: "Горячее",
    notePlaceholder: "Ручная лапша, острое",
    pointLabel: "Номер стола",
    pointsTitle: "Столы",
    pointPrefix: "Стол",
    pointPlaceholder: "7",
    soldOut: "Сегодня нет",
    freeWord: "Бесплатно",
    actions: [
      { kind: "waiter", label: "Официант", sent: "Отправлено — сейчас подойдут." },
      { kind: "bill", label: "Счёт", sent: "Отправлено — счёт готовят." },
    ],
  },
  en: {
    listTitle: "Menu",
    listEmpty: "The menu is not filled in yet.",
    itemWord: "Dish",
    addItem: "Add a dish",
    itemPlaceholder: "Lagman",
    itemPlaceholderRu: "Лагман",
    itemPlaceholderEn: "Lagman",
    categoryPlaceholder: "Hot dishes",
    notePlaceholder: "Hand-pulled, spicy",
    pointLabel: "Table number",
    pointsTitle: "Tables",
    pointPrefix: "Table",
    pointPlaceholder: "7",
    soldOut: "Off today",
    freeWord: "Free",
    actions: [
      { kind: "waiter", label: "Waiter", sent: "Sent — someone is on the way." },
      { kind: "bill", label: "Bill", sent: "Sent — your bill is being prepared." },
    ],
  },
};

// A hotel guest is in a room with a door they can close, which is why
// housekeeping replaces the bill: the bill happens at the desk on the way out,
// and "please make up the room" is the thing they cannot ask for without
// finding a telephone.
const HOTEL: Record<Lang, VenueWords> = {
  uz: {
    listTitle: "Xizmatlar",
    listEmpty: "Xizmatlar ro'yxati hali to'ldirilmagan.",
    itemWord: "Xizmat",
    addItem: "Xizmat qo'shish",
    itemPlaceholder: "Kir yuvish",
    itemPlaceholderRu: "Стирка",
    itemPlaceholderEn: "Laundry",
    categoryPlaceholder: "Xona xizmatlari",
    notePlaceholder: "Ertalab olib ketiladi, kechqurun qaytariladi",
    pointLabel: "Xona raqami",
    pointsTitle: "Xonalar",
    pointPrefix: "Xona",
    pointPlaceholder: "214",
    soldOut: "Vaqtincha yo'q",
    freeWord: "Bepul",
    actions: [
      { kind: "clean", label: "Tozalash", sent: "Yuborildi — xona tozalanadi." },
      { kind: "waiter", label: "Xodim", sent: "Yuborildi — xodim keladi." },
    ],
  },
  ru: {
    listTitle: "Услуги",
    listEmpty: "Список услуг пока не заполнен.",
    itemWord: "Услуга",
    addItem: "Добавить услугу",
    itemPlaceholder: "Стирка",
    itemPlaceholderRu: "Стирка",
    itemPlaceholderEn: "Laundry",
    categoryPlaceholder: "Обслуживание номеров",
    notePlaceholder: "Забираем утром, возвращаем вечером",
    pointLabel: "Номер комнаты",
    pointsTitle: "Комнаты",
    pointPrefix: "Комната",
    pointPlaceholder: "214",
    soldOut: "Временно нет",
    freeWord: "Бесплатно",
    actions: [
      { kind: "clean", label: "Уборка", sent: "Отправлено — номер уберут." },
      { kind: "waiter", label: "Персонал", sent: "Отправлено — сотрудник придёт." },
    ],
  },
  en: {
    listTitle: "Services",
    listEmpty: "The service list is not filled in yet.",
    itemWord: "Service",
    addItem: "Add a service",
    itemPlaceholder: "Laundry",
    itemPlaceholderRu: "Стирка",
    itemPlaceholderEn: "Laundry",
    categoryPlaceholder: "Room service",
    notePlaceholder: "Collected in the morning, back by evening",
    pointLabel: "Room number",
    pointsTitle: "Rooms",
    pointPrefix: "Room",
    pointPlaceholder: "214",
    soldOut: "Unavailable",
    freeWord: "Free",
    actions: [
      { kind: "clean", label: "Housekeeping", sent: "Sent — your room will be made up." },
      { kind: "waiter", label: "Staff", sent: "Sent — somebody is on the way." },
    ],
  },
};

// A shop has a counter rather than tables, and nobody brings the bill to you.
// One button: somebody come and help.
const SHOP: Record<Lang, VenueWords> = {
  uz: {
    listTitle: "Narxlar",
    listEmpty: "Narxlar hali qo'shilmagan.",
    itemWord: "Mahsulot",
    addItem: "Mahsulot qo'shish",
    itemPlaceholder: "Non",
    itemPlaceholderRu: "Хлеб",
    itemPlaceholderEn: "Bread",
    categoryPlaceholder: "Novvoyxona",
    notePlaceholder: "Issiq, tandirda",
    pointLabel: "Nuqta",
    pointsTitle: "Nuqtalar",
    pointPrefix: "Nuqta",
    pointPlaceholder: "1",
    soldOut: "Tugagan",
    freeWord: "Bepul",
    actions: [{ kind: "waiter", label: "Yordam", sent: "Yuborildi — hozir kelishadi." }],
  },
  ru: {
    listTitle: "Цены",
    listEmpty: "Цены пока не добавлены.",
    itemWord: "Товар",
    addItem: "Добавить товар",
    itemPlaceholder: "Хлеб",
    itemPlaceholderRu: "Хлеб",
    itemPlaceholderEn: "Bread",
    categoryPlaceholder: "Пекарня",
    notePlaceholder: "Горячий, из тандыра",
    pointLabel: "Точка",
    pointsTitle: "Точки",
    pointPrefix: "Точка",
    pointPlaceholder: "1",
    soldOut: "Закончился",
    freeWord: "Бесплатно",
    actions: [{ kind: "waiter", label: "Помощь", sent: "Отправлено — сейчас подойдут." }],
  },
  en: {
    listTitle: "Prices",
    listEmpty: "No prices added yet.",
    itemWord: "Product",
    addItem: "Add a product",
    itemPlaceholder: "Bread",
    itemPlaceholderRu: "Хлеб",
    itemPlaceholderEn: "Bread",
    categoryPlaceholder: "Bakery",
    notePlaceholder: "Hot, from the tandyr",
    pointLabel: "Point",
    pointsTitle: "Points",
    pointPrefix: "Point",
    pointPlaceholder: "1",
    soldOut: "Sold out",
    freeWord: "Free",
    actions: [{ kind: "waiter", label: "Help", sent: "Sent — someone is on the way." }],
  },
};

const BY_KIND: Record<VenueKind, Record<Lang, VenueWords>> = {
  cafe: CAFE,
  hotel: HOTEL,
  shop: SHOP,
  // Whatever else buys a tag. The cafe words are the general ones.
  other: CAFE,
};

export function venueWords(kind: VenueKind, lang: Lang): VenueWords {
  return BY_KIND[kind][lang];
}

/**
 * The words in the inbox.
 *
 * Nouns rather than sentences, and the same ones whatever the venue is. Every
 * kind can appear under any vertical — a hotel that was a cafe last month still
 * has its old rows — so "Ofitsiant chaqirildi" cannot be used here, and a
 * neutral verb like "Chaqirildi" says nothing at a glance. What the row is read
 * for is the table number and what it wants; one word does that better than a
 * sentence next to a number in a font twice its size.
 */
export const REQUEST_LABEL: Record<RequestKind, string> = {
  waiter: "Chaqiruv",
  bill: "Hisob",
  clean: "Tozalash",
  review: "Izoh",
  other: "So'rov",
};
