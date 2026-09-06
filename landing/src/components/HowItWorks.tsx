import Image from "next/image";
import { getTranslations } from "next-intl/server";

import Plate from "@/components/Plate";

// Three steps, before anything is offered for sale.
//
// It sits directly under the fork because it answers the question a visitor
// has after choosing a side and before looking at a price: what actually
// happens. The old site put it here too, and that ordering was the one thing
// about that page nobody argued with.
//
// Three pictures, not three numbers on a white page. The version that shipped
// first was a numeral, a heading and a sentence per step — correct, and it
// read as a table of contents. What the steps describe are three physical
// moments, and two of them we have photographs of.
//
// The first has no photograph on purpose. Step one is choosing a number, and
// the number is the product: a rendering of the actual plate says more than a
// stock photograph of somebody at a laptop, and it is the same plate the
// directory and the sample section use, so it is the real object rather than
// an illustration of one.
const STEPS = [
  { n: 1, photo: null },
  { n: 2, photo: "/mahsulot/qurilmalar.webp" },
  { n: 3, photo: "/mahsulot/tegizish.webp" },
] as const;

export default async function HowItWorks() {
  const t = await getTranslations("how");

  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("eyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("title")}
        </h2>

        <ol className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-3">
          {STEPS.map(({ n, photo }) => (
            <li key={n}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-paper">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 352px, (min-width: 640px) 33vw, 100vw"
                    quality={90}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_32%,var(--color-ink-s1)_0%,var(--color-ink)_72%)]">
                    <Plate handle="MYN042" size="md" />
                  </div>
                )}
              </div>

              <p className="mt-4 font-mono text-[13px] font-semibold tracking-[0.14em] text-line-lead">
                0{n}
              </p>
              <h3 className="mt-1 text-lg leading-6 font-semibold">
                {t(`step${n}Title`)}
              </h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">
                {t(`step${n}Body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
