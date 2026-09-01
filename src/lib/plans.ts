// What a buyer pays for, in three parts.
//
// The number is bought once and is theirs. The device that carries it is
// manufactured and priced separately. The platform that answers when someone
// taps it costs something to run every month, so it is paid for every month.
//
// Splitting them is what keeps the business from going backwards: a one-time
// payment against a cost that never stops is a slow loss, and the profile of
// every buyer has to stay up for as long as they own the number.

export type PlanId = "free" | "premium";

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in so'm. Zero for the free plan. */
  monthly: number;
  /** A year up front, priced as ten months. */
  yearly: number;
  tagline: string;
  includes: string[];
};

/**
 * The plan a handle is actually on right now.
 *
 * The column says what was bought; the expiry says whether it still holds. A
 * lapsed premium falls back to free rather than going dark — the number was
 * paid for and stays reachable — so this is the only place the two are read
 * together, and nothing downstream has to remember the rule.
 */
export function activePlan(
  stored: string | null | undefined,
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): PlanId {
  if (stored !== "premium") return "free";
  if (!expiresAt) return "free";
  return new Date(expiresAt) > now ? "premium" : "free";
}

/**
 * What the profile opens in.
 *
 * Gold marks a paid subscription rather than a card design, and that is a
 * commercial decision more than a visual one: the monthly plan had no visible
 * benefit at all — a link limit nobody sees — and a mark that is plainly worth
 * having, and plainly goes away when the payments stop, is the strongest thing
 * a subscription can offer.
 */
export const PLAN_ACCENT: Record<PlanId, string> = {
  free: "#abff09",
  premium: "#d9c48f",
};

/** Links a free profile may show. Unlimited on premium. */
export const FREE_LINK_LIMIT = 5;

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Oddiy",
    monthly: 0,
    yearly: 0,
    tagline: "Raqam narxiga kiritilgan",
    includes: [
      "Shaxsiy profil sahifasi",
      `${FREE_LINK_LIMIT} tagacha havola`,
      "QR-kod",
      "Kontaktni saqlash tugmasi",
      "Umumiy tashriflar soni",
      "Katalogdagi dizaynlar",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthly: 49_000,
    yearly: 490_000,
    tagline: "Profilni to'liq ishlatish uchun",
    includes: [
      "Cheksiz havolalar",
      "To'liq analitika — kunlik grafik va har bir havola bo'yicha",
      "Postlar va obunachilar",
      "AI dizayn so'rovi",
      "Rezidentlar reytingida ko'rinish",
      "Sahifadagi Flex yozuvi olib tashlanadi",
    ],
  },
] as const;

export const DEFAULT_PLAN: PlanId = "free";

export function plan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function isPlan(value: unknown): value is PlanId {
  return PLANS.some((p) => p.id === value);
}

/** Months of a yearly payment that are free, for the copy that advertises it. */
export function yearlyMonthsFree(): number {
  const premium = plan("premium");
  return Math.round((premium.monthly * 12 - premium.yearly) / premium.monthly);
}
