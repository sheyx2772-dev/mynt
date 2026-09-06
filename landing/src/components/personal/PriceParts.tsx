import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import ProfilePlans, {
  PREMIUM_MONTHLY,
} from "@/components/personal/ProfilePlans";
import { Link } from "@/i18n/navigation";
import { DEVICES } from "@/lib/devices";
import { BASE_PRICE } from "@/lib/pricing";

// Three prices, said as three.
//
// A buyer who is told one figure and then meets two more at checkout stops
// trusting the first one, so all three stand here at once: the number, the
// object it is carried on, and the monthly plan. Each is quoted from where it
// is actually decided — the base price from the pricing rule, the object from
// the cheapest thing on the shelf — rather than typed in again, because a
// figure typed twice is a figure that goes stale in one of the two places.
export default async function PriceParts() {
  const t = await getTranslations("personal");
  const format = await getFormatter();

  const cheapestDevice = Math.min(...DEVICES.map((device) => device.price));

  return (
    <section id="price" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("priceEyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("priceTitle")}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
          {t("priceLead")}
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Part
            title={t("numberTitle")}
            note={t("numberNote")}
            prefix={t("from")}
            amount={format.number(BASE_PRICE)}
            unit={`${t("soum")} · ${t("oneTime")}`}
          />

          <Part
            title={t("deviceTitle")}
            note={t("deviceNote")}
            prefix={t("from")}
            amount={format.number(cheapestDevice)}
            unit={`${t("soum")} · ${t("perDevice")}`}
          >
            <Link
              href="/devices"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
            >
              {t("deviceCta")}
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Part>

          {/* The one part with two prices. The big figure is zero, because
              keeping a profile up is what the number already paid for; the
              monthly one is named as premium rather than left as "from", so
              nobody reads it as the price of staying online. */}
          <Part
            title={t("planTitle")}
            note={t("planNote")}
            lead={t("freePrice")}
            prefix={t("premiumName")}
            amount={format.number(PREMIUM_MONTHLY)}
            unit={`${t("soum")} / ${t("perMonth")}`}
          />
        </div>

        <ProfilePlans />
      </div>
    </section>
  );
}

function Part({
  title,
  note,
  prefix,
  amount,
  unit,
  lead,
  children,
}: {
  title: string;
  note: string;
  /** What the figure is: "from", or the name of the plan it belongs to. */
  prefix: string;
  amount: string;
  unit: string;
  /** What the part costs before anything is added — "free", where it is. */
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-tile border border-line bg-white p-6 sm:p-8">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 flex-1 leading-relaxed text-ink-2">{note}</p>

      {lead && <p className="mt-6 font-semibold text-lime-ink">{lead}</p>}

      <p
        className={`flex flex-wrap items-baseline gap-x-2 ${lead ? "mt-1" : "mt-6"}`}
      >
        <span className="text-[13px] text-ink-3">{prefix}</span>
        <span className="font-mono text-3xl font-semibold tracking-[0.04em]">
          {amount}
        </span>
        <span className="text-[13px] text-ink-3">{unit}</span>
      </p>

      {children}
    </div>
  );
}
