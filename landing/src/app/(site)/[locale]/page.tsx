import { setRequestLocale } from "next-intl/server";

import Counter from "@/components/Counter";
import Devices from "@/components/Devices";
import Faq from "@/components/Faq";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Residents from "@/components/Residents";
import TryIt from "@/components/TryIt";
import TwoWays from "@/components/TwoWays";
import Verticals from "@/components/Verticals";

// The entry page, in the order somebody decides in.
//
// Claim, then the one thing they can do before choosing a side, then the fork.
// Then how it works, what carries it, where it goes — the product explained
// before anything is asked for. Then TryIt, which is the first moment they can
// hold the thing rather than read about it, and it comes after the explanation
// because a QR code shown to somebody who does not yet know what opens is a
// QR code nobody scans.
//
// Residents and Counter sit last before the price, and that ordering is the
// argument: other people have these, and there are fewer left than you think.
// Both read live data and both render nothing when the backend is unreachable,
// so the page still makes its case with the two of them missing.
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
      <TryIt />
      <Residents />
      <Counter />
      <Pricing />
      <Faq />
    </main>
  );
}
