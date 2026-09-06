import { setRequestLocale } from "next-intl/server";

import Devices from "@/components/Devices";
import Faq from "@/components/Faq";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import TwoWays from "@/components/TwoWays";
import Verticals from "@/components/Verticals";

// The entry page, being rebuilt a screen at a time.
//
// What is here so far is the first screen: the claim, the one thing a visitor
// can do before choosing a side, and the fork between the two products. The
// sections that follow — how it works, the objects it is issued on, who has
// just joined, the price, the questions — arrive next, in that order, because
// that is the order somebody decides in.
export default async function HomePage({
  params,
  searchParams,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The check answers here. `?number=AAA777` is what the form leaves behind,
  // which is also what makes the answer linkable.
  const { number } = await searchParams;
  const asked = typeof number === "string" ? number : undefined;

  return (
    <main className="flex-1">
      <Hero asked={asked} />
      <TwoWays />
      <HowItWorks />
      <Devices />
      <Verticals />
      <Pricing />
      <Faq />
    </main>
  );
}
