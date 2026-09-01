// The card designs Flex issues. Nothing here reproduces a mark owned by anyone
// else: a card carrying a borrowed logo is an infringement the moment it is
// sold, and is not a differentiator either, since a logo can be copied. A low
// genesis serial cannot.
//
// A design is either drawn in CSS or backed by artwork in public/kartalar. The
// artwork never carries the handle, the URL or the wordmark — those differ per
// owner and are printed over the design at render time, so one image serves
// every buyer who picks it.

export type CardDesign = {
  id: string;
  name: string;
  description: string;
  /** Artwork under public/kartalar. Absent for the CSS-drawn designs. */
  image?: string;
  /** Set when the artwork already carries a contactless mark of its own. */
  artworkHasNfc?: boolean;
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
  },
  {
    id: "rahbar",
    name: "Rahbar",
    description:
      "Mutlaq qora, o'rtasidan bitta sayqallangan kumush chiziq. Eng kam narsa ko'rsatadigan, eng ko'p narsa aytadigan variant.",
    image: "/kartalar/rahbar.jpg",
    artworkHasNfc: true,
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
  },
] as const satisfies readonly CardDesign[];

export type CardDesignId = (typeof CARD_DESIGNS)[number]["id"];

export const DEFAULT_CARD_DESIGN: CardDesignId = "genesis";

export function cardDesign(id: CardDesignId): CardDesign {
  return CARD_DESIGNS.find((d) => d.id === id) ?? CARD_DESIGNS[0];
}

export function isCardDesign(value: unknown): value is CardDesignId {
  return CARD_DESIGNS.some((d) => d.id === value);
}
