import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { pageSeo } from "@/lib/seo";
import DevicePrices from "./DevicePrices";
import Examples from "./Examples";
import Lapsed from "./Lapsed";
import RarityTables from "./RarityTables";
import Subscription from "./Subscription";

// Nothing on this page depends on a request: the rule, the shelf and the plans
// are all constants the build can read, so all three languages are rendered
// once and served as files.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricingPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Its own address, its three siblings and the share card block.
    ...pageSeo("/pricing", locale),
  };
}

// The long form of the price.
//
// The entry page carries the summary — three buyers, three figures — and a
// reader arrives here having seen it and wanting the arithmetic. So this does
// not repeat the card: it starts at the rule, ends at what happens when the
// paying stops, and its whole job is that somebody can work out what their own
// number costs without asking anybody.
export default async function PricingPage({
  params,
}: PageProps<"/[locale]/pricing">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricingPage");

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h1 className="text-[34px] leading-10 font-semibold tracking-tight sm:text-[42px] sm:leading-[3rem]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{t("lead")}</p>
      </div>

      <RarityTables />
      <Examples />

      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-xl font-semibold">{t("blockedTitle")}</h2>
          {/* What is refused, without naming what is on the list. The list is
              a map of the words somebody would otherwise have to guess, and a
              page that prints it is a page that hands it over. */}
          <p className="mt-2 max-w-2xl leading-relaxed text-ink-2">
            {t("blockedBody")}
          </p>
        </div>
      </section>

      <DevicePrices />
      <Subscription />
      <Lapsed />

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
          {t("ctaTitle")}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
          {t("ctaBody")}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          {/* The check field is the first thing on the entry page, so the
              answer to "what does mine cost" is one press away rather than a
              second calculator maintained here. */}
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-input bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
          >
            {t("ctaCheck")}
          </Link>
          <Link
            href="/personal"
            className="flex h-12 items-center justify-center rounded-input border border-line-2 px-6 text-sm font-semibold text-ink transition-colors hover:border-line-lead"
          >
            {t("ctaBuy")}
          </Link>
        </div>
      </section>
    </main>
  );
}
