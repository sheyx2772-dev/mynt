import { setRequestLocale } from "next-intl/server";

import Hero from "@/components/Hero";
import TwoWays from "@/components/TwoWays";

// The entry page, being rebuilt a screen at a time.
//
// What is here so far is the first screen: the claim, the one thing a visitor
// can do before choosing a side, and the fork between the two products. The
// sections that follow — how it works, the objects it is issued on, who has
// just joined, the price, the questions — arrive next, in that order, because
// that is the order somebody decides in.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex-1">
      <Hero />
      <TwoWays />
    </main>
  );
}
