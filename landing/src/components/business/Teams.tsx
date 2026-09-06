import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

// The other buyer: a company handing cards to its staff.
//
// It is on this page rather than on its own because the person who arrives
// here is often the same person — an owner who came for the tables and leaves
// having bought fifteen cards for the sales floor. On the ink, so the switch
// from venue to company is visible before a word is read.
//
// The three terms below the price are the ones that actually decide a company
// purchase, and the third has to be legible to the employee carrying the card
// as well as to the firm buying it: a number that is not yours should never be
// a surprise.
export default async function Teams() {
  const t = await getTranslations("business");

  const terms = [1, 2, 3] as const;

  return (
    <section
      id="teams"
      className="relative scroll-mt-24 overflow-hidden bg-ink"
    >
      <div className="pointer-events-none absolute -top-24 right-0 size-96 rounded-full bg-lime/10 blur-[110px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-16 text-white sm:py-20">
        <p className="cap text-lime">{t("teamsEyebrow")}</p>
        <h2 className="mt-2 max-w-xl text-[28px] leading-8 font-semibold tracking-tight">
          {t("teamsTitle")}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-paper-2">
          {t("teamsLead")}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-tile">
            <Image
              src="/mahsulot/karta-katta.webp"
              alt={t("teamsTitle")}
              fill
              sizes="(min-width: 1024px) 528px, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-semibold tracking-[0.04em] text-lime">
                {t("teamsPrice")}
              </span>
              <span className="text-[13px] text-paper-3">{t("soum")}</span>
            </p>
            <p className="mt-1.5 text-sm text-paper-2">{t("teamsPriceNote")}</p>

            <dl className="mt-7 space-y-4 border-t border-ink-line pt-6">
              {terms.map((n) => (
                <div key={n}>
                  <dt className="font-semibold">{t(`teamsTerm${n}Title`)}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-paper-2">
                    {t(`teamsTerm${n}Body`)}
                  </dd>
                </div>
              ))}
            </dl>

            <a
              href="#enquiry"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-input bg-lime px-5 text-sm font-semibold text-ink transition-colors hover:bg-lime-press"
            >
              {t("teamsCta")}
              <ArrowRight className="size-4" strokeWidth={2} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
