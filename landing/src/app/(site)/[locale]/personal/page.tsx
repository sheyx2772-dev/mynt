import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import NumberPicker from "@/components/personal/NumberPicker";
import OrderStep from "@/components/personal/OrderStep";
import PersonalFaq from "@/components/personal/PersonalFaq";
import PersonalHero from "@/components/personal/PersonalHero";
import PriceParts from "@/components/personal/PriceParts";
import WhatArrives from "@/components/personal/WhatArrives";
import { routing } from "@/i18n/routing";
import { pageSeo } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/personal">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "personal" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Its own address, its three siblings and the share card block.
    ...pageSeo("/personal", locale),
  };
}

// One person, one number.
//
// The sections are in the order somebody decides in, and the order is the
// design: what am I buying, can I have the one I want, what does it cost and
// why is part of it monthly, what turns up, what about the thing that worries
// me, and then — last, once all of that is answered — the button.
//
// Every call to action above the order step is an anchor down this page rather
// than a link off it. A visitor who came from "Band qilish" on the entry page
// has already chosen a side; sending them somewhere else to pick a number
// would be asking them to choose again.
export default async function PersonalPage({
  params,
  searchParams,
}: PageProps<"/[locale]/personal">) {
  const { locale } = await params;
  setRequestLocale(locale);

  // `?number=AAA777` is what the checker leaves behind — on this page and on
  // the entry page, which is how the "take it" button over there arrives here
  // with the number already in hand. It is also what makes an answer linkable.
  const { number } = await searchParams;
  const asked = typeof number === "string" ? number : undefined;

  return (
    <main className="flex-1">
      <PersonalHero />
      <NumberPicker asked={asked} />
      <PriceParts />
      <WhatArrives />
      <PersonalFaq />
      <OrderStep asked={asked} />
    </main>
  );
}
