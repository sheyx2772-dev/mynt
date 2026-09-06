import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

// Two products, two ways of paying, said as two.
//
// A person buys a number once and owns it; a cafe pays every month for
// something that keeps working. Putting both in one table would make one of
// them look like a tier of the other, and a cafe owner would spend the whole
// section working out which column is theirs.
//
// The figures are the entry price of each, not the range. A range on a
// marketing page is a table somebody has to read; "from 100 000" is a fact
// somebody can act on, and the calculator above answers the rest.
export default async function Pricing() {
  const t = await getTranslations("price");

  return (
    <section id="narx" className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("eyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("title")}
        </h2>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col rounded-tile border border-line p-6 sm:p-8">
            <h3 className="text-xl font-semibold">{t("personal")}</h3>
            <p className="mt-2 flex-1 text-ink-2">{t("personalNote")}</p>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-[13px] text-ink-3">{t("from")}</span>
              <span className="font-mono text-3xl font-semibold tracking-[0.04em]">
                100 000
              </span>
              <span className="text-[13px] text-ink-3">{t("soum")}</span>
            </p>

            <Link
              href="/personal"
              className="mt-6 flex h-12 items-center justify-center gap-2 rounded-input bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
            >
              {t("cta")}
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="flex flex-col rounded-tile border border-line p-6 sm:p-8">
            <h3 className="text-xl font-semibold">{t("venue")}</h3>
            <p className="mt-2 flex-1 text-ink-2">{t("venueNote")}</p>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-[13px] text-ink-3">{t("from")}</span>
              <span className="font-mono text-3xl font-semibold tracking-[0.04em]">
                149 000
              </span>
              <span className="text-[13px] text-ink-3">
                {t("soum")} / {t("monthly")}
              </span>
            </p>

            <Link
              href="/business"
              className="mt-6 flex h-12 items-center justify-center gap-2 rounded-input border border-line-2 text-sm font-semibold text-ink transition-colors hover:border-line-lead"
            >
              {t("venueCta")}
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
