// The card designs Mynt issues. Every one is drawn here in CSS — there are no
// image files to license, and nothing reproduces a mark owned by anyone else.
// A card carrying a borrowed logo is an infringement the moment it is sold and
// is not a differentiator either, since a logo can be copied. A low genesis
// serial cannot.

export const CARD_DESIGNS = [
  {
    id: "genesis",
    name: "Genesis",
    description:
      "Asosiy karta. Chuqur qora fon, donador tekstura va lime nuqta — MYNT CARD seriyasining o'zi.",
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
] as const;

export type CardDesignId = (typeof CARD_DESIGNS)[number]["id"];

export const DEFAULT_CARD_DESIGN: CardDesignId = "genesis";

export function isCardDesign(value: unknown): value is CardDesignId {
  return CARD_DESIGNS.some((d) => d.id === value);
}
