import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import CardFace from "@/components/CardFace";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { CARD_DESIGNS, designAccent } from "@/lib/card-designs";
import { pageSeo } from "@/lib/seo";

// Three files, prerendered, and nothing here that could be otherwise: the
// catalogue is ten rows in a source file and the artwork is on disk beside it.
// A design cannot appear or disappear between two visitors, so there is nothing
// for a request to find out.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalogue">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Its own address, and the same page in the other two languages.
    ...pageSeo("/catalogue", locale),
  };
}

/**
 * The same number on all ten faces.
 *
 * A catalogue exists so somebody can compare designs, and ten cards carrying
 * ten different numbers make them compare numbers instead. It is also not a
 * number anyone holds: `AAA777` is the shape a handle takes, shown so a reader
 * can see where theirs would sit, and printing a real resident's number across
 * a marketing page is publishing somebody else's card without asking.
 */
const SAMPLE = "AAA777";

/**
 * How wide a face actually renders. Wrong here means a soft card.
 *
 * The artwork is 1200px across, so the widest ask on this page — one column on
 * a phone, roughly 360 CSS px at three device pixels — lands just inside what
 * the files hold. A wider box would be asking for pixels that do not exist,
 * and `next/image` cannot invent them.
 */
const SIZES = "(min-width: 1024px) 354px, (min-width: 640px) 50vw, 92vw";

// Every design a card can be ordered in.
//
// Ten, and all ten real: six drawn and four printed from artwork, which is why
// the drawn ones are drawn here rather than photographed or stood in for. A
// catalogue that showed a placeholder where a design was inconvenient would be
// selling something nobody can be sent.
export default async function CataloguePage({
  params,
}: PageProps<"/[locale]/catalogue">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalogue");

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h1 className="text-[34px] leading-10 font-semibold tracking-tight sm:text-[42px] sm:leading-[3rem]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">{t("lead")}</p>

        <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-ink-3">
          {t("note", { handle: SAMPLE })}
        </p>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {CARD_DESIGNS.map((design) => (
            <li key={design.id}>
              <CardFace design={design.id} handle={SAMPLE} sizes={SIZES} />

              <div className="mt-3.5 px-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-semibold">{design.name}</h2>
                  <span className="cap shrink-0 text-ink-3">
                    {t(`accents.${designAccent(design.id)}`)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  {t(`designs.${design.id}`)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-14 rounded-tile border border-line bg-white p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("ctaTitle")}
          </h2>
          <p className="mt-2 max-w-lg leading-relaxed text-ink-2">
            {t("ctaBody")}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/personal"
              className="inline-flex h-12 items-center rounded-input bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
            >
              {t("cta")}
            </Link>
            <Link
              href="/devices"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
            >
              {t("devices")}
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
