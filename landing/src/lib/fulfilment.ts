import type { Lang } from "@/lib/i18n";

// Where a device order has got to, and where it is allowed to go next.
//
// Kept as data rather than as conditions spread through the pages, because two
// screens read it — the maker's queue and the buyer's cabinet — and they have
// to agree about what a parcel is doing. The database holds the same six
// states in orders_fulfilment_check; this is where the meaning of moving
// between them lives.
//
// The buyer sees these words, so they are in the buyer's language.

export type Fulfilment =
  | "address_needed"
  | "queued"
  | "making"
  | "shipped"
  | "delivered"
  | "returned";

export const FULFILMENT_STATES: readonly Fulfilment[] = [
  "address_needed",
  "queued",
  "making",
  "shipped",
  "delivered",
  "returned",
];

export function isFulfilment(value: unknown): value is Fulfilment {
  return (
    typeof value === "string" && (FULFILMENT_STATES as readonly string[]).includes(value)
  );
}

/**
 * What may follow what.
 *
 * Forward only, with two exceptions that are real rather than theoretical: a
 * parcel that comes back has to be able to go out again, and a queue can be
 * re-ordered by putting something back. Nothing may leave `address_needed`
 * except into the queue, because until there is an address there is nowhere
 * for it to go — the database enforces the same rule, and this is the copy of
 * it that lets the screen grey a button out instead of showing an error.
 */
const NEXT: Record<Fulfilment, readonly Fulfilment[]> = {
  address_needed: ["queued"],
  queued: ["making", "returned"],
  making: ["shipped", "queued"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  returned: ["queued"],
};

export function canAdvance(from: Fulfilment, to: Fulfilment): boolean {
  return NEXT[from].includes(to);
}

export function nextStates(from: Fulfilment): readonly Fulfilment[] {
  return NEXT[from];
}

/** The one step the maker takes most, so the queue can offer a single button. */
export function usualNext(from: Fulfilment): Fulfilment | null {
  return NEXT[from][0] ?? null;
}

/** Still ours to do something about. */
export function isOpen(state: Fulfilment): boolean {
  return state !== "delivered";
}

/**
 * How far along, for a progress line the buyer can read at a glance.
 *
 * `returned` is deliberately not on the scale: it is not a stage of getting
 * there, and drawing it as one would tell somebody their parcel is 100% of the
 * way to being sent back.
 */
export function step(state: Fulfilment): { index: number; of: number } | null {
  const line: readonly Fulfilment[] = [
    "address_needed",
    "queued",
    "making",
    "shipped",
    "delivered",
  ];
  const index = line.indexOf(state);
  return index === -1 ? null : { index: index + 1, of: line.length };
}

/**
 * The mark each state wears, named once because three screens draw them: the
 * maker's queue, the buyer's order page and the cabinet. A parcel that is a van
 * in one place and a box in another is two parcels to whoever is reading.
 */
export const FULFILMENT_ICON: Record<Fulfilment, string> = {
  address_needed: "map-pin",
  queued: "list-checks",
  making: "hammer",
  shipped: "truck",
  delivered: "package-check",
  returned: "undo-2",
};

type Words = { label: string; buyer: string; action: string };

const WORDS: Record<Lang, Record<Fulfilment, Words>> = {
  uz: {
    address_needed: {
      label: "Manzil kerak",
      buyer: "Qurilmani qayerga yuborishimizni yozing",
      action: "Navbatga qo'yish",
    },
    queued: {
      label: "Navbatda",
      buyer: "Buyurtma qabul qilindi, navbatda turibdi",
      action: "Yasashga olish",
    },
    making: {
      label: "Yasalyapti",
      buyer: "Qurilmangiz yasalyapti",
      action: "Yuborildi deb belgilash",
    },
    shipped: {
      label: "Yuborildi",
      buyer: "Yo'lda — pochtaga topshirildi",
      action: "Yetkazildi deb belgilash",
    },
    delivered: {
      label: "Yetkazildi",
      buyer: "Yetkazildi",
      action: "Qaytarilgan deb belgilash",
    },
    returned: {
      label: "Qaytarildi",
      buyer: "Qaytarildi — biz siz bilan bog'lanamiz",
      action: "Navbatga qaytarish",
    },
  },
  ru: {
    address_needed: {
      label: "Нужен адрес",
      buyer: "Укажите, куда отправить устройство",
      action: "В очередь",
    },
    queued: {
      label: "В очереди",
      buyer: "Заказ принят и стоит в очереди",
      action: "Взять в производство",
    },
    making: {
      label: "Изготавливается",
      buyer: "Ваше устройство изготавливается",
      action: "Отметить отправленным",
    },
    shipped: {
      label: "Отправлено",
      buyer: "В пути — передано в доставку",
      action: "Отметить доставленным",
    },
    delivered: {
      label: "Доставлено",
      buyer: "Доставлено",
      action: "Отметить возвратом",
    },
    returned: {
      label: "Возврат",
      buyer: "Возврат — мы свяжемся с вами",
      action: "Вернуть в очередь",
    },
  },
  en: {
    address_needed: {
      label: "Address needed",
      buyer: "Tell us where to send it",
      action: "Put in the queue",
    },
    queued: {
      label: "In the queue",
      buyer: "Ordered, and in the queue",
      action: "Start making it",
    },
    making: {
      label: "Being made",
      buyer: "Your device is being made",
      action: "Mark it shipped",
    },
    shipped: {
      label: "Shipped",
      buyer: "On its way — handed to the courier",
      action: "Mark it delivered",
    },
    delivered: {
      label: "Delivered",
      buyer: "Delivered",
      action: "Mark it returned",
    },
    returned: {
      label: "Returned",
      buyer: "Returned — we will be in touch",
      action: "Put it back in the queue",
    },
  },
};

/** The short name of the state, for the queue. */
export function fulfilmentLabel(state: Fulfilment, lang: Lang): string {
  return WORDS[lang][state].label;
}

/** The same state said to the person waiting for the parcel. */
export function fulfilmentForBuyer(state: Fulfilment, lang: Lang): string {
  return WORDS[lang][state].buyer;
}

/** What the button that moves it on should say. */
export function advanceLabel(from: Fulfilment, lang: Lang): string | null {
  const to = usualNext(from);
  return to ? WORDS[lang][from].action : null;
}
