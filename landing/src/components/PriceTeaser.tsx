import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BASE_PRICE } from "@/lib/pricing";
import { VENUE_BANDS } from "@/lib/venues";
import { formatUZS } from "@/lib/format";
import type { site, Lang } from "@/lib/i18n";

// What it costs.
//
// The calculator and the bands moved to their own pages, and nothing replaced
// them here — so the front page stopped naming a price at all, and a visitor
// who did not click through learned what we sell without ever learning what it
// costs. Two lines is enough: one number each, and the page that explains it.
//
// Both figures are read from the same constants the checkout uses, so the front
// page cannot quote a price the calculator disagrees with.

type Site = ReturnType<typeof site>;

export default function PriceTeaser({ s, lang }: { s: Site; lang: Lang }) {
  const rows = [
    {
      href: "/shaxsiy#narx",
      title: s.pricePersonal,
      note: s.pricePersonalNote,
      // A plain three letters and three digits, before any rarity multiplier.
      amount: formatUZS(BASE_PRICE, lang),
      unit: null,
    },
    {
      href: "/biznes",
      title: s.priceVenue,
      note: s.priceVenueNote,
      amount: formatUZS(VENUE_BANDS[0].monthly, lang),
      unit: s.priceMonthly,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
      <p className="text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
        {s.priceEyebrow}
      </p>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
        {s.priceTitle}
      </h2>

      <div className="mt-8 divide-y divide-black/8 border-y border-black/8">
        {rows.map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className="group flex flex-wrap items-baseline gap-x-6 gap-y-2 py-6 transition-colors hover:bg-black/[0.02]"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-semibold tracking-tight">
                {row.title}
              </span>
              <span className="mt-1 block text-sm text-flex-black/50">{row.note}</span>
            </span>

            <span className="flex items-baseline gap-2">
              <span className="text-sm text-flex-black/40">{s.priceFrom}</span>
              <span className="font-display font-tabular text-2xl font-semibold sm:text-3xl">
                {row.amount}
              </span>
              {row.unit && <span className="text-sm text-flex-black/40">{row.unit}</span>}
            </span>

            <ArrowRight className="h-4 w-4 shrink-0 text-flex-black/30 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
