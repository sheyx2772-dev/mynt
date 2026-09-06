// What the number is paying for, read the way the backend reads it.
//
// `tarif` is already the effective plan — the Go side folds a lapsed premium
// into "free" before it answers (`handles.EffectivePlan`), so nothing here
// decides money. What this adds is the countdown: a premium with a date is a
// premium that ends, and the cabinet says how many days are left rather than
// printing a timestamp and leaving the arithmetic to the owner.

export type PlanState = {
  tier: "free" | "premium";
  /** When it lapses. Absent on free, and on a premium that does not lapse. */
  expires?: Date;
  daysLeft?: number;
  /** Inside the window where a reminder is worth the space it takes. */
  endingSoon: boolean;
};

const SOON_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

export function planState(
  tier: "free" | "premium",
  expiresAt?: string,
  now = new Date(),
): PlanState {
  if (tier !== "premium" || !expiresAt) return { tier, endingSoon: false };

  const expires = new Date(expiresAt);
  const daysLeft = Math.max(
    0,
    Math.ceil((expires.getTime() - now.getTime()) / DAY),
  );
  return { tier, expires, daysLeft, endingSoon: daysLeft <= SOON_DAYS };
}
