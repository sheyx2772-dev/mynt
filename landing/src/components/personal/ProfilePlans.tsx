import { getFormatter, getTranslations } from "next-intl/server";
import { Check } from "lucide-react";

/**
 * What premium costs, in so'm.
 *
 * The authority is `backend/internal/orders/subscribe.go` — an order is priced
 * there, from the stored plan, never from what the browser sends — and these
 * two numbers are the copy this page needs to quote a figure without a round
 * trip. A handle's price is not duplicated that way because `lib/pricing.ts`
 * already carries the rule and a test fingerprints it against the backend;
 * there is no such rule here, only two amounts.
 *
 * The year is ten months rather than twelve, which is where "two months free"
 * comes from — the sentence is arithmetic on these two figures, so changing
 * one without the other makes the page lie.
 */
export const PREMIUM_MONTHLY = 49_000;
const PREMIUM_YEARLY = 490_000;

const FREE = [1, 2, 3, 4, 5] as const;
const PREMIUM = [1, 2, 3, 4, 5] as const;

// The monthly part, and what it is for.
//
// It is the one thing on this page that could be read as "so the number is
// rented after all", so it is answered rather than listed: the free column is
// what the number's price already bought, the paid column is what is added,
// and the line under both says what happens when somebody stops paying. A
// lapsed plan falls back to standard and the number stays — that is what the
// backend actually does, and it is the answer to the objection.
export default async function ProfilePlans() {
  const t = await getTranslations("personal");
  const format = await getFormatter();

  return (
    <div className="mt-14">
      <h3 className="text-xl font-semibold tracking-tight">
        {t("plansTitle")}
      </h3>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-2">
        {t("plansLead")}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-tile border border-line bg-white p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-lg font-semibold">{t("freeName")}</h4>
            <span className="font-mono text-sm tracking-[0.04em] text-ink-3">
              {t("freePrice")}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-ink-3">{t("freeNote")}</p>

          <ul className="mt-5 space-y-2.5">
            {FREE.map((n) => (
              <li key={n} className="flex gap-2.5 text-[15px] text-ink-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-line-lead"
                  strokeWidth={2}
                />
                {t(`free${n}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-tile border border-line-lead bg-white p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-lg font-semibold">{t("premiumName")}</h4>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold tracking-[0.04em]">
                {format.number(PREMIUM_MONTHLY)}
              </span>
              <span className="text-[13px] text-ink-3">
                {t("soum")} / {t("perMonth")}
              </span>
            </span>
          </div>
          <p className="mt-1 text-[13px] text-ink-3">{t("premiumNote")}</p>

          <ul className="mt-5 space-y-2.5">
            {PREMIUM.map((n) => (
              <li key={n} className="flex gap-2.5 text-[15px] text-ink-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-lime-ink"
                  strokeWidth={2}
                />
                {t(`prem${n}`)}
              </li>
            ))}
          </ul>

          <p className="mt-5 border-t border-line-soft pt-4 text-[13px] text-ink-3">
            {t("premiumYear", { yearly: format.number(PREMIUM_YEARLY) })}
          </p>
        </div>
      </div>

      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2">
        {t("lapse")}
      </p>
    </div>
  );
}
