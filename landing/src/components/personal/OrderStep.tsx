import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { parseHandle } from "@/lib/pricing";

const STEPS = [1, 2, 3] as const;

// The last thing on the page, and the only thing on it to do.
//
// The number the visitor checked is carried down here from the address bar, so
// somebody who typed AAA777 at the top does not have to remember it at the
// bottom. It is parsed rather than printed: `?number=` is whatever was in the
// URL, and a page that renders it back unchecked is a page that renders
// whatever a link was built to make it render.
//
// Nothing here decides a sale. The button is a way into the cabinet with the
// number in hand; whether that number can actually be sold, and for how much,
// is decided there against the stored row — a price or an availability that
// arrived from this page would be a figure the buyer chose.
export default async function OrderStep({ asked }: { asked?: string }) {
  const t = await getTranslations("personal");

  const parsed = asked ? parseHandle(asked) : null;
  const handle = parsed ? parsed.letters + parsed.digits : null;

  return (
    <section id="order" className="scroll-mt-20 border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("orderEyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("orderTitle")}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
          {t("orderLead")}
        </p>

        <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((n) => (
              <li key={n}>
                <span className="font-mono text-xl leading-6 font-semibold tracking-[0.1em] text-line-lead">
                  {n}
                </span>
                <h3 className="mt-2 text-lg leading-6 font-semibold">
                  {t(`orderStep${n}Title`)}
                </h3>
                <p className="mt-2 leading-6 text-ink-2">
                  {t(`orderStep${n}Body`)}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-tile border border-line bg-paper p-6 lg:mt-0">
            <p className="cap text-ink-3">{t("chosenLabel")}</p>

            {handle ? (
              <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.14em] text-ink">
                {handle}
              </p>
            ) : (
              <p className="mt-2 text-ink-3">{t("orderPick")}</p>
            )}

            {handle ? (
              <Link
                href={{ pathname: "/login", query: { number: handle } }}
                className="mt-5 flex h-12 items-center justify-center gap-2 rounded-input bg-lime text-sm font-semibold text-ink transition-colors hover:bg-lime-press"
              >
                {t("orderCta")}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            ) : (
              <a
                href="#number"
                className="mt-5 flex h-12 items-center justify-center gap-2 rounded-input bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
              >
                {t("ctaPick")}
                <ArrowRight className="size-4" strokeWidth={2} />
              </a>
            )}

            <p className="mt-3 text-[13px] text-ink-3">{t("orderNote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
