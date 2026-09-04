// A venue's subscription, as arithmetic.
//
// Split out of venue-billing.ts, which reaches the database and so cannot be
// imported from a client component. The panel where an owner picks a term has
// to price it as they press the buttons, which means the pricing has to live
// where the browser can reach it — and the same functions are what the server
// writes onto the document, so there is exactly one of each.

export type VenueInvoice = {
  id: string;
  number: number;
  points: number;
  months: number;
  monthly: number;
  vatPercent: number;
  total: number;
  status: "issued" | "paid" | "cancelled";
  issuedAt: string;
  paidAt: string | null;
};

export const MONTH_OPTIONS = [1, 3, 6, 12] as const;
export type MonthOption = (typeof MONTH_OPTIONS)[number];

export function isMonthOption(value: unknown): value is MonthOption {
  return typeof value === "number" && (MONTH_OPTIONS as readonly number[]).includes(value);
}

/**
 * Where a venue stands.
 *
 * One date answers every question worth asking, which is why there is only one
 * — trial and subscription are the same fact seen twice, and a second flag
 * would be a second thing to keep in step with it.
 */
export type PlanState = {
  expiresAt: string;
  /** Negative once it has run out. */
  daysLeft: number;
  active: boolean;
  /** Worth saying out loud before it happens rather than after. */
  endingSoon: boolean;
};

export function planState(expiresAt: string, now = Date.now()): PlanState {
  const end = new Date(expiresAt).getTime();
  const daysLeft = Math.ceil((end - now) / (24 * 60 * 60 * 1000));

  return {
    expiresAt,
    daysLeft,
    active: end > now,
    endingSoon: end > now && daysLeft <= 7,
  };
}

/**
 * What a term costs.
 *
 * The band follows the point count, so a venue that prints ten more table tags
 * moves up a band — which is the honest way to price it, since ten more tables
 * is ten more places the product is doing its job.
 */
export function venueInvoiceTotal(
  points: number,
  months: number,
  monthly: number,
  vatPercent = 0,
): { net: number; vat: number; total: number } {
  const net = months * monthly;
  const vat = Math.round((net * vatPercent) / 100);
  return { net, vat, total: net + vat };
}

