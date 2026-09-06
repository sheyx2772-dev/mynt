import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

// The ladder, once, after the four sections have each quoted their own rung.
//
// Repeating a figure four times invites the question this answers: what
// happens when the venue is bigger than the example. Priced per venue rather
// than per seat because twenty tables charged as twenty staff seats would come
// to 580 000 a month, against a market where a whole venue pays the equivalent
// of $8–20 — the seat model does not survive being carried across.
export default async function Bands() {
  const t = await getTranslations("business");

  const bands = [1, 2, 3] as const;

  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("bandsEyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("bandsTitle")}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
          {t("bandsLead")}
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {bands.map((n) => (
            <li
              key={n}
              className="rounded-tile border border-line bg-paper p-6"
            >
              <p className="cap text-ink-3">{t(`band${n}Name`)}</p>
              {/* The last rung is a sentence rather than a figure, and it is
                  set in the body face for that reason: a word in the number
                  face reads as a number that failed to load. */}
              <p
                className={
                  n === 3
                    ? "mt-3 text-xl font-semibold tracking-tight"
                    : "mt-3 flex items-baseline gap-2"
                }
              >
                {n === 3 ? (
                  t("band3Price")
                ) : (
                  <>
                    <span className="font-mono text-3xl font-semibold tracking-[0.04em]">
                      {t(`band${n}Price`)}
                    </span>
                    <span className="text-[13px] text-ink-3">
                      {t("soum")} / {t("monthly")}
                    </span>
                  </>
                )}
              </p>
              {n === 3 && (
                <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
                  {t("band3Note")}
                </p>
              )}
            </li>
          ))}
        </ul>

        <a
          href="#enquiry"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-input bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
        >
          {t("bandsAsk")}
          <ArrowRight className="size-4" strokeWidth={2} />
        </a>
      </div>
    </section>
  );
}
