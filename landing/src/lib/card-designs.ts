// Every design a card can be ordered in.
//
// Nothing here reproduces a mark owned by anybody else. A card carrying a
// borrowed logo is an infringement the moment it is sold, and it is not a
// differentiator either — a logo can be copied in an afternoon. A low serial
// cannot.
//
// A design is either drawn or backed by artwork under `public/kartalar`. The
// artwork never carries the handle, the address or the wordmark: those differ
// per owner and are printed over the design at render time, so one file serves
// every buyer who picks it. That is also why the four `.webp` files may be
// cached hard and why nothing is re-exported when somebody buys a number.
//
// Ported from the site this one replaces. Two things were dropped on the way.
// The Uzbek prose moved to the message catalogue, because this site is read in
// three languages and a description in a data file is a description that only
// exists in one. The `theme` field went with it: `lib/profile/theme.ts` already
// maps a design id to the look its profile opens in, and it says there that the
// mapping is the one fact it owns — two tables deciding the same thing is one
// table that will disagree.

/**
 * The accent a card is finished in — and, because the profile is the card's
 * continuation, the accent its profile opens in.
 *
 * Somebody who paid for the gold engraving should see gold when a stranger taps
 * it. If the palette were one global choice, gold would be a paint colour; tied
 * to the object it is a rank, and one a competitor cannot copy without making
 * the cards too.
 *
 * Three names, three tokens from `globals.css`, and no private palette. The old
 * site kept its own champagne (#d9c48f) and steel (#c8cdd6) here, so the card
 * face carried two colours that appear nowhere else in the product. It bought
 * nothing: measured on the card's ink ground, the brand gold reaches 8.7:1 and
 * `line-2` 12.3:1, both clear of the 7:1 that the card's ten-pixel small caps
 * need. A colour that is only ever used once is a colour nobody maintains.
 */
export type Accent = "lime" | "gold" | "steel";

/** Written out rather than built from the name — Tailwind reads source, not values. */
export const ACCENT_CLASS: Record<Accent, string> = {
  lime: "bg-lime",
  gold: "bg-gold",
  steel: "bg-line-2",
};

export type CardDesign = {
  id: string;
  /**
   * The same in all three languages, and so not in the message catalogue.
   *
   * A design name is what a buyer says on the phone and what an order line
   * reads. Translating it would give one card three names, which is three
   * cards as far as anybody answering that phone can tell.
   */
  name: string;
  /** Artwork under `public/kartalar`, 1200x757. Absent for the drawn designs. */
  image?: string;
  /** Set when the artwork already prints a contactless mark of its own. */
  artworkHasNfc?: boolean;
  /** Defaults to the brand lime, for the designs that carry no metal. */
  accent?: Accent;
};

export const CARD_DESIGNS = [
  { id: "genesis", name: "Genesis" },
  { id: "lime", name: "Lime" },
  { id: "grid", name: "Grid" },
  { id: "sheen", name: "Sheen" },
  { id: "naqsh", name: "Naqsh" },
  { id: "paper", name: "Paper", accent: "steel" },
  {
    id: "rahbar",
    name: "Rahbar",
    image: "/kartalar/rahbar.webp",
    artworkHasNfc: true,
    accent: "steel",
  },
  { id: "devops", name: "DevOps", image: "/kartalar/devops.webp" },
  {
    id: "suzani",
    name: "Suzani",
    image: "/kartalar/suzani.webp",
    artworkHasNfc: true,
    accent: "gold",
  },
  {
    id: "xarita",
    name: "Xarita",
    image: "/kartalar/xarita.webp",
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

/**
 * Whether a stored string names a design this build can draw.
 *
 * The backend keeps `dizayn` as free text, so a card ordered after this build
 * shipped arrives here as a name nothing in `CARD_DESIGNS` matches. That is a
 * newer catalogue, not bad data — the caller falls back to the default rather
 * than rendering a card with no face.
 */
export function isCardDesign(value: unknown): value is CardDesignId {
  return CARD_DESIGNS.some((d) => d.id === value);
}
