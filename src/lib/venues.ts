// What a service business buys, and what it costs.
//
// The personal product prices a name: one number, one profile, one owner. A
// venue is a different shape — one owner and many points, where a point is a
// table, a room, a door or a chair. Everything else is the same engine: an NFC
// object, an address, a page behind it and a panel to edit it.
//
// The seat model from the team plan does not carry over, and that is worth
// stating rather than discovering later. Twenty tables charged as twenty seats
// at 29,000 would be 580,000 a month, against an international market where a
// whole venue pays roughly $8–20. So a venue is priced as a venue, in bands.

export type VerticalId = "cafe" | "hotel" | "auto" | "other";

export const VERTICALS: readonly VerticalId[] = ["cafe", "hotel", "auto", "other"] as const;

export function isVertical(value: unknown): value is VerticalId {
  return typeof value === "string" && (VERTICALS as readonly string[]).includes(value);
}

/**
 * Price bands, by how many points the venue has.
 *
 * `monthly: null` means the band is negotiated: a chain or a large hotel wants
 * a conversation about branding, hardware and invoicing anyway, and a number
 * printed here would be one we would talk them out of.
 */
export const VENUE_BANDS = [
  { maxPoints: 15, monthly: 149_000 },
  { maxPoints: 40, monthly: 299_000 },
  { maxPoints: Infinity, monthly: null },
] as const;

export type VenueBand = (typeof VENUE_BANDS)[number];

/** The largest point count we will take as an answer, and a typo guard. */
export const MAX_POINTS = 100_000;

export function bandFor(points: number): VenueBand {
  const n = Math.max(1, Math.floor(points) || 1);
  return VENUE_BANDS.find((band) => n <= band.maxPoints) ?? VENUE_BANDS[VENUE_BANDS.length - 1];
}

/** So'm per month, or null when the band is negotiated. */
export function venueMonthly(points: number): number | null {
  return bandFor(points).monthly;
}

/**
 * What one point costs per month at a given size, for the comparison a buyer
 * actually makes: "so what is that per table?".
 *
 * Returned rather than displayed everywhere, because it is only honest at the
 * top of a band — thirty tables at 299,000 is 9,967 each, three tables at
 * 149,000 is 49,667. Showing it beside the band price is the point: it makes
 * the jump visible instead of hiding it.
 */
export function perPointMonthly(points: number): number | null {
  const monthly = venueMonthly(points);
  if (monthly === null) return null;
  const n = Math.max(1, Math.floor(points) || 1);
  return Math.round(monthly / n);
}

/** A sensible starting point count, per vertical, for the calculator. */
export const TYPICAL_POINTS: Record<VerticalId, number> = {
  cafe: 12,
  hotel: 30,
  // A taxi park or a delivery fleet, which is the size at which a plate per car
  // is worth managing centrally rather than one driver at a time.
  auto: 25,
  other: 8,
};
