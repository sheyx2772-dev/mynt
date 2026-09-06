import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";

import { money } from "@/lib/devices";
import {
  MIN_TEAM_SEATS,
  PERSONAL_MONTHLY,
  PERSONAL_YEARLY,
  TEAM_SEAT_MONTHLY,
  VENUE_BANDS,
} from "@/lib/plans";
import { lines } from "./lines";

// What the monthly payment buys, and who pays which one.
//
// The free plan is listed first and in full. Hiding it makes the paid one look
// compulsory, and it is not: a number keeps working on the free plan for as
// long as somebody owns it.
//
// Every figure comes from `plans.ts`, which is what the backend bills from.
// A price typed into the markup is a price the server will not honour.
export default async function Subscription() {
  const t = await getTranslations("pricingPage");

  const plans = [
    {
      id: "free",
      name: t("planFree"),
      note: t("planFreeNote"),
      monthly: 0,
      items: lines(t.raw("planFreeItems")),
    },
    {
      id: "premium",
      name: t("planPremium"),
      note: t("planPremiumNote"),
      monthly: PERSONAL_MONTHLY,
      items: lines(t.raw("planPremiumItems")),
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="cap text-ink-3">{t("subEyebrow")}</p>
      <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
        {t("subTitle")}
      </h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
        {t("subBody")}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-tile border border-line bg-white p-6 sm:p-8"
          >
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="mt-1.5 text-sm text-ink-3">{plan.note}</p>

            {plan.monthly > 0 && (
              <p className="mt-5 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold tracking-[0.04em]">
                  {money(plan.monthly)}
                </span>
                <span className="text-[13px] text-ink-3">
                  {t("soum")} / {t("perMonth")}
                </span>
              </p>
            )}

            <ul className="mt-6 space-y-2.5">
              {plan.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-lime-ink"
                    strokeWidth={2.5}
                  />
                  <span className="text-ink-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[13px] text-ink-3">
        {t("planYearly", {
          price: money(PERSONAL_YEARLY),
          // Not "two months free" in the copy: the discount is whatever the
          // two figures make it, and a sentence that outlives them is how a
          // page starts advertising a saving nobody is offering.
          months: Math.round(PERSONAL_YEARLY / PERSONAL_MONTHLY),
        })}
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold">{t("teamTitle")}</h3>
          <p className="mt-2 leading-relaxed text-ink-2">
            {t("teamBody", {
              price: money(TEAM_SEAT_MONTHLY),
              min: MIN_TEAM_SEATS,
            })}
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold">{t("venueTitle")}</h3>
          <p className="mt-2 leading-relaxed text-ink-2">{t("venueBody")}</p>

          <ul className="mt-5">
            {VENUE_BANDS.map((band, index) => (
              <li
                key={String(band.maxPoints)}
                className="flex items-baseline justify-between gap-4 border-b border-line-soft py-3 text-sm last:border-0"
              >
                <span>
                  {Number.isFinite(band.maxPoints)
                    ? t("venueUpTo", { n: band.maxPoints })
                    : t("venueOver", { n: VENUE_BANDS[index - 1].maxPoints })}
                </span>
                {/* `null` is a conversation, not a gift. A blank cell here
                    would read as free to the one buyer big enough to matter. */}
                <span className="font-mono font-semibold whitespace-nowrap">
                  {band.monthly === null ? (
                    <span className="font-sans font-normal text-ink-2">
                      {t("venueNegotiated")}
                    </span>
                  ) : (
                    <>
                      {money(band.monthly)}{" "}
                      <span className="font-sans text-[13px] font-normal text-ink-3">
                        {t("soum")} / {t("perMonth")}
                      </span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
