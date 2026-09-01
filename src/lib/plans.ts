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
  /** Monthly price in so'm. Zero for the free plan. */
  monthly: number;
  /** A year up front, priced as ten months. */
  yearly: number;
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
 * The plan a handle is on once its company is taken into account.
 *
 * A firm pays by the seat, so every number on that account is premium for as
 * long as the company's own subscription holds. Without this the company would
 * pay 29,000 a seat and its staff would carry free profiles — no statistics, no
 * contacts collected, and the Flex mark still on a card the firm branded.
 *
 * Either side can carry it: a handle bought premium personally before joining a
 * company keeps what it paid for, and whichever runs longer is the one that
 * counts.
 */
export function effectivePlan(
  handlePlan: string | null | undefined,
  handleExpiresAt: string | null | undefined,
  teamExpiresAt: string | null | undefined = null,
  now: Date = new Date(),
): PlanId {
  if (activePlan(handlePlan, handleExpiresAt, now) === "premium") return "premium";
  if (teamExpiresAt && new Date(teamExpiresAt) > now) return "premium";
  return "free";
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

/**
 * Services a profile may list, by plan.
 *
 * Five on the free plan rather than three. A services list is the reason a
 * tradesman or a lawyer keeps the card at all, and a rival offering more of
 * them wins on the only line the buyer compares. The premium difference has to
 * come from things the free plan can afford to lack — the statistics, the
 * contacts collected — not from cutting the feature that sells the product.
 */
export const SERVICE_LIMIT: Record<PlanId, number> = {
  free: 5,
  premium: 8,
};

export function serviceLimit(id: PlanId): number {
  return SERVICE_LIMIT[id];
}

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    monthly: 0,
    yearly: 0,
  },
  {
    id: "premium",
    monthly: 49_000,
    yearly: 490_000,
  },
] as const;

/**
 * What a company pays, per seat, per month.
 *
 * Below the personal plan on purpose: a firm buying twenty is buying in volume,
 * and the market prices team seats under the individual subscription for the
 * same reason. Blinq charges $4.99–6.99 a seat and HiHello $5, which lands
 * around 60–85 thousand so'm; ours sits under both because the salaries these
 * come out of do too.
 */
export const TEAM_SEAT_MONTHLY = 29_000;

/** A year up front, priced as ten months, the same as the personal plan. */
export const TEAM_SEAT_YEARLY = TEAM_SEAT_MONTHLY * 10;

/**
 * Fewer than this and it is not a company, it is a few people who should each
 * buy the personal plan — and supporting a two-seat "team" costs more than it
 * earns.
 */
export const MIN_TEAM_SEATS = 5;

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
