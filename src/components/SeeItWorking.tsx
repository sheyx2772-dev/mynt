import Link from "next/link";
import { ArrowUpRight, BellRing, ReceiptText } from "lucide-react";

import PhoneFrame from "@/components/PhoneFrame";
import ProfilePreview, { type PreviewLabels } from "@/components/ProfilePreview";
import { formatNumber } from "@/lib/format";
import type { MenuCategory, Venue } from "@/lib/menu";
import type { site } from "@/lib/i18n";

// The first thing on the page, and the only one that does not have to be read.
//
// Under it the page asks a visitor which of two products they are here for.
// Somebody who arrived from an advertisement, or from seeing a card in
// somebody's hand, cannot answer that yet — they do not know what this is. A
// phone with the thing on it answers in the time it takes to look.
//
// One of the two is real: the menu is the demo venue, and tapping it opens the
// page a guest at that table would get. The profile beside it is a sample and
// says so, because the residents are people and putting one of them on the
// front of the shop is something you ask for rather than take.

type Site = ReturnType<typeof site>;

export default function SeeItWorking({
  s,
  labels,
  venue,
  categories,
  demoHandle,
}: {
  s: Site;
  labels: PreviewLabels;
  /** Null when there is no demo venue to show; the menu phone then goes away. */
  venue: Venue | null;
  categories: MenuCategory[];
  demoHandle: string;
}) {
  // Enough of the menu to read as one, and not so much that the frame scrolls.
  const shown = categories
    .flatMap((category) => category.items.map((item) => ({ ...item, section: category.name })))
    .slice(0, 5);

  return (
    <section className="mx-auto max-w-6xl px-6 pt-14 pb-4 sm:pt-20">
      <p className="text-center text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
        {s.seeEyebrow}
      </p>
      <h2 className="mx-auto mt-3 max-w-lg text-center font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
        {s.seeTitle}
      </h2>

      <div className="mt-10 flex flex-wrap items-start justify-center gap-10 sm:gap-14">
        <figure className="w-[290px]">
          <Link href="/shaxsiy" className="block transition-transform hover:-translate-y-1">
            <PhoneFrame>
              <ProfilePreview labels={labels} />
            </PhoneFrame>
          </Link>
          <figcaption className="mt-5 text-center">
            <span className="block font-display font-semibold tracking-tight">
              {s.seeProfile}
            </span>
            <span className="mt-0.5 block text-sm text-flex-black/45">{s.seeProfileNote}</span>
          </figcaption>
        </figure>

        {venue && shown.length > 0 && (
          <figure className="w-[290px]">
            {/* Not a mock-up of a menu: this is the demo venue's own rows, and
                the link opens the page a guest at table seven would see. */}
            <Link
              href={`/${demoHandle}?stol=7`}
              className="block transition-transform hover:-translate-y-1"
            >
              <PhoneFrame>
                <div>
                  <div className="relative overflow-hidden rounded-[1.4rem] bg-flex-black px-5 py-4 text-white">
                    <p className="font-display text-lg font-semibold tracking-tight">
                      {venue.name}
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">{venue.hours}</p>
                    <span className="absolute top-4 right-5 rounded-lg bg-lime px-2 py-1 font-tabular text-xs font-semibold text-flex-black">
                      7
                    </span>
                  </div>

                  <div className="mt-4 divide-y divide-black/6 border-y border-black/6">
                    {shown.map((item) => (
                      <div key={item.id} className="flex items-baseline gap-3 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {item.name}
                        </span>
                        <span className="shrink-0 font-tabular text-sm font-semibold">
                          {formatNumber(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* The half a printed menu cannot do, which is the whole
                      argument for the venue product. */}
                  <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-flex-black p-1.5">
                    <span className="flex items-center justify-center gap-1.5 rounded-xl bg-lime px-3 py-2 text-xs font-semibold text-flex-black">
                      <BellRing className="h-3.5 w-3.5" />
                      {s.menuCallWaiter}
                    </span>
                    <span className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white">
                      <ReceiptText className="h-3.5 w-3.5" />
                      {s.menuAskBill}
                    </span>
                  </div>
                </div>
              </PhoneFrame>
            </Link>
            <figcaption className="mt-5 text-center">
              <span className="block font-display font-semibold tracking-tight">
                {s.seeMenu}
              </span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-sm text-lime-ink">
                {s.seeMenuNote}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
