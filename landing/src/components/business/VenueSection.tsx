import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";

import type { Venue } from "./venues";

// One trade, answered in the order somebody deciding asks.
//
// What the guest does, what the owner gets, what it costs. That order is the
// whole argument: an owner who has not seen what happens on the guest's phone
// has no way to judge a price, and a page that leads with the price is asking
// them to.
//
// The photograph is a landscape crop of a landscape source, which is why it is
// sharp. `sizes` names the box's width, and the two-column box is 528px wide —
// so the smallest file behind this, at 1152, still covers a two-times screen
// without the browser stretching anything.
export default async function VenueSection({
  venue,
  flip,
}: {
  venue: Venue;
  /** Photograph on the right, so consecutive sections do not read as a list. */
  flip: boolean;
}) {
  const t = await getTranslations("business");
  const k = (suffix: string) => t(`${venue.id}${suffix}`);

  const guest = [1, 2, 3, 4, 5];
  const owner = [1, 2, 3, 4];

  return (
    // `scroll-mt` so a link from the footer does not land the heading under
    // the sticky header.
    <section id={venue.id} className="scroll-mt-24 border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <p className="cap text-ink-3">{k("Point")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {k("Name")}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">{k("Lead")}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className={flip ? "lg:order-last" : undefined}>
            <div className="relative aspect-[3/2] overflow-hidden rounded-tile border border-line bg-paper">
              <Image
                src={venue.photo}
                alt={k("Name")}
                fill
                sizes="(min-width: 1024px) 528px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="mt-4 rounded-card border border-line bg-white p-5">
              <p className="cap text-ink-3">{t("priceLabel")}</p>
              <p className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold tracking-[0.04em]">
                  {k("Price")}
                </span>
                <span className="text-[13px] text-ink-3">
                  {t("soum")} / {t("monthly")}
                </span>
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
                {k("PriceNote")}
              </p>
            </div>
          </div>

          <div>
            <h3 className="cap text-ink-3">{t("guestSide")}</h3>
            <ul className="mt-3 space-y-2">
              {guest.map((n) => (
                <li key={n} className="flex gap-2.5 text-[15px] text-ink-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-lime-ink"
                    strokeWidth={2.4}
                  />
                  {k(`Guest${n}`)}
                </li>
              ))}
            </ul>

            {/* Ruled rather than ticked. These are sentences, not features,
                and a column of checkmarks beside a column of checkmarks makes
                the two halves of the argument look like one list. */}
            <h3 className="cap mt-8 text-ink-3">{t("ownerSide")}</h3>
            <ul className="mt-3 space-y-3">
              {owner.map((n) => (
                <li
                  key={n}
                  className="border-l-2 border-line pl-3.5 text-[15px] leading-relaxed text-ink-2"
                >
                  {k(`Owner${n}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
