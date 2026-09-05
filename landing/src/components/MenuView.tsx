import { Wifi, Clock, MapPin } from "lucide-react";

import Plate from "@/components/ui/Plate";
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
      <header className="-mx-5 border-b border-line px-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[24px] leading-7 font-semibold tracking-[-0.01em]">
              {venue.name}
            </h1>
            {venue.hours && (
              <p className="mt-1 flex items-center gap-1.5 text-[16px] leading-6 text-ink-2">
                <Clock className="h-4 w-4 shrink-0" />
                {venue.hours}
              </p>
            )}
          </div>

          {/* The table number is the same object as the number on a card, so
              it is drawn the same way. Lime was wrong here twice over: it is
              not an action, and the guest already knows which table they are
              sitting at. */}
          {point && <Plate n={point} size="md" className="shrink-0" />}
        </div>

        {(venue.address || venue.wifiName) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {venue.wifiName && (
              <span className="flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-[13px] leading-[18px] text-ink-2">
                <Wifi className="h-4 w-4 shrink-0" />
                {venue.wifiName}
                {venue.wifiPassword && (
                  <span className="num text-ink-3">· {venue.wifiPassword}</span>
                )}
              </span>
            )}
            {venue.address && (
              <span className="flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-[13px] leading-[18px] text-ink-2">
                <MapPin className="h-4 w-4 shrink-0" />
                {venue.address}
              </span>
            )}
          </div>
        )}
      </header>

      {categories.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-line-2 px-6 py-10 text-center text-[16px] leading-6 text-ink-3">
          {w.listEmpty}
        </p>
      ) : (
        categories.map((category) => (
          <section key={category.id} className="mt-6">
            {category.name && (
              <h2 className="mb-2 text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                {category.name}
              </h2>
            )}

            <div className="-mx-5 divide-y divide-line border-y border-line px-5">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.available
                      ? "flex min-h-[56px] items-start gap-4 py-3"
                      : "flex min-h-[56px] items-start gap-4 py-3 opacity-45"
                  }
                >
                  {item.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-input bg-fill object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] leading-6">{item.name}</p>
                    {item.note && (
                      <p className="text-[13px] leading-[18px] text-ink-3">
                        {item.note}
                      </p>
                    )}
                    {!item.available && (
                      <p className="mt-0.5 text-[13px] leading-[18px] font-medium text-ink-2">
                        {w.soldOut}
                      </p>
                    )}
                  </div>

                  <p className="num shrink-0 text-[16px] leading-6 font-semibold">
                    {item.price === 0 ? (
                      <span className="font-normal text-ink-3">{w.freeWord}</span>
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
