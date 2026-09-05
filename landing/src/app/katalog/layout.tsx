import type { Metadata } from "next";

// The catalogue is a sales showcase, not a directory. Every card is badged
// NAMUNA and several carry real, named people who have not yet said yes to
// being listed, so it is deliberately kept out of search results: reachable by
// link, which is how it is shown to somebody, and not indexed. Lift the
// noindex once the people on it have agreed.
export const metadata: Metadata = {
  title: "Namunalar — flex.com.uz",
  description: "NFC vizitka namunalari: tashkilotlar, rahbarlar va maketlar.",
  robots: { index: false, follow: false },
};

export default function KatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
