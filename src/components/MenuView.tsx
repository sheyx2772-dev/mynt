import Image from "next/image";
import { Wifi, Clock, MapPin } from "lucide-react";

import { formatNumber } from "@/lib/format";
import type { MenuCategory, Venue } from "@/lib/menu";
import type { VenueWords } from "@/lib/venue-words";

// What a guest sees after tapping the stand on the table.
//
// Read standing up, one hand, in a room that is louder and darker than an
// office — so it is a list with the price on the right and nothing between the
// dish and its price. No hero, no explanation of what Flex is: they came to
// eat, not to meet us.
//
// A dish that is off today stays on the page, dimmed and labelled. Removing it
// would read as a menu that never had it, and the guest would ask for it
// anyway.

export default function MenuView({
  venue,
  categories,
  point,
  w,
}: {
  venue: Venue;
  categories: MenuCategory[];
  /** Which table or room this was opened from, if the URL said. */
  point: string | null;
  w: VenueWords;
}) {
  return (
    <div>
      <header className="grain relative overflow-hidden rounded-[1.75rem] bg-flex-black px-6 py-7 text-white">
        <div className="bg-dot-grid-light absolute inset-0 opacity-25" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {venue.name}
            </h1>
            {venue.hours && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/50">
                <Clock className="h-3.5 w-3.5" />
                {venue.hours}
              </p>
            )}
          </div>

          {point && (
            <span className="shrink-0 rounded-xl bg-lime px-3 py-1.5 font-tabular text-sm font-medium text-flex-black">
              {point}
            </span>
          )}
        </div>

        {(venue.address || venue.wifiName) && (
          <div className="relative mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {venue.wifiName && (
              <span className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-xs text-white/70">
                <Wifi className="h-3.5 w-3.5 text-lime" />
                {venue.wifiName}
                {venue.wifiPassword && (
                  <span className="font-tabular text-white/45">· {venue.wifiPassword}</span>
                )}
              </span>
            )}
            {venue.address && (
              <span className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-xs text-white/70">
                <MapPin className="h-3.5 w-3.5" />
                {venue.address}
              </span>
            )}
          </div>
        )}
      </header>

      {categories.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-black/15 px-6 py-10 text-center text-sm text-flex-black/50">
          {w.listEmpty}
        </p>
      ) : (
        categories.map((category) => (
          <section key={category.id} className="mt-8">
            {category.name && (
              <h2 className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                {category.name}
              </h2>
            )}

            <div className="divide-y divide-black/6 border-y border-black/6">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.available
                      ? "flex items-start gap-4 py-3.5"
                      : "flex items-start gap-4 py-3.5 opacity-45"
                  }
                >
                  {item.photoUrl && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
                      <Image
                        src={item.photoUrl}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="leading-tight font-medium">{item.name}</p>
                    {item.note && (
                      <p className="mt-1 text-xs leading-relaxed text-flex-black/45">
                        {item.note}
                      </p>
                    )}
                    {!item.available && (
                      <p className="mt-1 text-xs font-medium text-flex-black/50">
                        {w.soldOut}
                      </p>
                    )}
                  </div>

                  <p className="shrink-0 font-tabular font-semibold">
                    {item.price === 0 ? (
                      <span className="text-sm font-medium text-flex-black/45">
                        {w.freeWord}
                      </span>
                    ) : (
                      formatNumber(item.price)
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
