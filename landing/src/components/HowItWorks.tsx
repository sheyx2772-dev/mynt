import { getTranslations } from "next-intl/server";

// Three steps, before anything is offered for sale.
//
// It sits directly under the fork because it answers the question a visitor
// has after choosing a side and before looking at a price: what actually
// happens. The old site put it here too, and that ordering was the one thing
// about that page nobody argued with.
//
// Numbered in the face numbers are set in. The product is a number; the step
// count is the one other place on the page where a numeral is doing work
// rather than decoration.
export default async function HowItWorks() {
  const t = await getTranslations("how");

  const steps = [1, 2, 3] as const;

  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
          {t("title")}
        </h2>

        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((n) => (
            <li key={n}>
              <span className="font-mono text-xl leading-6 font-semibold tracking-[0.1em] text-line-lead">
                {n}
              </span>
              <h3 className="mt-2 text-xl leading-6 font-semibold">
                {t(`step${n}Title`)}
              </h3>
              <p className="mt-2 leading-6 text-ink-2">{t(`step${n}Body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
