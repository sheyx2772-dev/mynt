// The card designs Flex issues. Nothing here reproduces a mark owned by anyone
// else: a card carrying a borrowed logo is an infringement the moment it is
// sold, and is not a differentiator either, since a logo can be copied. A low
// genesis serial cannot.
//
// A design is either drawn in CSS or backed by artwork in public/kartalar. The
// artwork never carries the handle, the URL or the wordmark — those differ per
// owner and are printed over the design at render time, so one image serves
// every buyer who picks it.

/**
 * The accent a card is finished in — and, because the profile is the card's
 * continuation, the accent its profile opens in.
 *
 * A person who paid for the gold engraving should see gold when they tap it. If
 * the palette were a single global choice, gold would be a paint colour; tied to
 * the object it is a rank, and it is one the competitor cannot copy without
 * making the cards too.
 *
 * The champagne below measures 11.5:1 against the card's ground. A truer gold
 * (#B8860B) measures 6.0:1 — legible, but half as legible, and the card sets its
 * rubrics at ten pixels in small caps, where that difference is the difference
 * between reading a label and guessing it.
 */
export type Accent = "lime" | "gold" | "steel";

export const ACCENT_HEX: Record<Accent, string> = {
  lime: "#abff09",
  gold: "#d9c48f",
  steel: "#c8cdd6",
};

export type CardDesign = {
  id: string;
  name: string;
  description: string;
  /** Artwork under public/kartalar. Absent for the CSS-drawn designs. */
  image?: string;
  /** Set when the artwork already carries a contactless mark of its own. */
  artworkHasNfc?: boolean;
  /** Defaults to the brand lime when the artwork carries no metal of its own. */
  accent?: Accent;
};

export const CARD_DESIGNS = [
  {
    id: "genesis",
    name: "Genesis",
    description:
      "Asosiy karta. Chuqur qora fon, donador tekstura va lime nuqta — FLEX CARD seriyasining o'zi.",
  },
  {
    id: "lime",
    name: "Lime",
    description: "Teskari variant: to'liq lime maydon, qora yozuv. Uzoqdan ham ko'zga tashlanadi.",
  },
  {
    id: "grid",
    name: "Grid",
    description: "Nuqtali to'r. Muhandislik chizmasi kabi quruq va aniq.",
  },
  {
    id: "sheen",
    name: "Sheen",
    description: "Diagonal yorug'lik oqimi — qo'lda burilganda metall kabi tovlanadi.",
  },
  {
    id: "naqsh",
    name: "Naqsh",
    description:
      "Sakkiz burchakli geometrik panjara. An'anaviy koshinkorlik geometriyasidan ilhomlangan original chizma.",
  },
  {
    id: "paper",
    name: "Paper",
    description: "Oq, deyarli bo'sh. Faqat handle va ingichka chegara.",
    accent: "steel",
  },
  {
    id: "rahbar",
    name: "Rahbar",
    description:
      "Mutlaq qora, o'rtasidan bitta sayqallangan kumush chiziq. Eng kam narsa ko'rsatadigan, eng ko'p narsa aytadigan variant.",
    image: "/kartalar/rahbar.jpg",
    artworkHasNfc: true,
    accent: "steel",
  },
  {
    id: "devops",
    name: "DevOps",
    description:
      "Qora fonda past kontrastli plata chizmasi, bittasi lime bo'lib yonadi. Texnik, ammo shovqinsiz.",
    image: "/kartalar/devops.jpg",
  },
  {
    id: "suzani",
    name: "Suzani",
    description:
      "Chuqur indigo fonda suzani medalyoni — kashta tekstura kabi, o'z fonidan bir oz ochiqroq, bitta oltin ip bilan.",
    image: "/kartalar/suzani.jpg",
    artworkHasNfc: true,
    accent: "gold",
  },
  {
    id: "xarita",
    name: "Xarita",
    description:
      "Qora fonda oltin o'ymakori: O'zbekiston xaritasi va yonida Humo medalyoni. Davlat ramzi emas — o'z chizmamiz.",
    image: "/kartalar/xarita.jpg",
    artworkHasNfc: true,
    accent: "gold",
  },
] as const satisfies readonly CardDesign[];

export type CardDesignId = (typeof CARD_DESIGNS)[number]["id"];

export const DEFAULT_CARD_DESIGN: CardDesignId = "genesis";

export function cardDesign(id: CardDesignId): CardDesign {
  return CARD_DESIGNS.find((d) => d.id === id) ?? CARD_DESIGNS[0];
}

export function designAccent(id: CardDesignId): Accent {
  return cardDesign(id).accent ?? "lime";
}

export function accentHex(id: CardDesignId): string {
  return ACCENT_HEX[designAccent(id)];
}

export function isCardDesign(value: unknown): value is CardDesignId {
  return CARD_DESIGNS.some((d) => d.id === value);
}
