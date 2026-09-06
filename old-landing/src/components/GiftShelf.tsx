import Link from "next/link";
import { Gift as GiftIcon } from "lucide-react";

import type { Shelf } from "@/lib/gifts";

// The shelf: what people have given this profile.
//
// Counted tiles first — a crown with a 3 on it says more than three crowns —
// then the latest few with who gave them and what they wrote. The button to
// give one is the loudest thing here for a visitor, because it is the one
// social act on the page that also pays for the product.

export default function GiftShelf({
  handle,
  shelf,
  isOwner,
  labels,
}: {
  handle: string;
  shelf: Shelf;
  isOwner: boolean;
  labels: { gifts: string; sendGift: string; empty: string; manage: string };
}) {
  const recent = shelf.gifts.filter((g) => g.shown).slice(0, 6);

  return (
    <section className="mt-6" aria-label={labels.gifts}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <GiftIcon className="size-4 text-mute" strokeWidth={1.8} aria-hidden />
          {labels.gifts}
        </p>
        <Link
          href={isOwner ? `/kabinet/${handle}/sovgalar` : `/${handle}/sovga`}
          className={`flex h-8 items-center rounded-plate px-3 text-[11px] font-bold tracking-[0.04em] uppercase ${
            isOwner ? "bg-slab/10 text-page" : "bg-lime text-on-accent"
          }`}
        >
          {isOwner ? labels.manage : labels.sendGift}
        </Link>
      </div>

      {shelf.counts.length === 0 ? (
        <p className="mt-2 text-sm text-mute">{labels.empty}</p>
      ) : (
        <>
          <ul className="mt-3 flex flex-wrap gap-2">
            {shelf.counts.map((c) => (
              <li
                key={c.sticker}
                title={c.name}
                className={`gift-tile gift-${c.tier} relative flex size-14 items-center justify-center rounded-plate text-3xl`}
              >
                <span aria-hidden>{c.emoji}</span>
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-slab px-1.5 py-0.5 text-center font-tabular text-[10px] font-bold leading-none text-on-slab">
                  {c.count}
                </span>
                <span className="sr-only">
                  {c.name} × {c.count}
                </span>
              </li>
            ))}
          </ul>
          {recent.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {recent.map((g) => (
                <li key={g.id} className="flex items-baseline gap-2">
                  <span className="text-base leading-none" aria-hidden>{g.emoji}</span>
                  {g.fromHandle ? (
                    <Link href={`/${g.fromHandle}`} className="font-medium">{g.from}</Link>
                  ) : (
                    <span className="font-medium">{g.from}</span>
                  )}
                  {g.note && <span className="min-w-0 truncate text-mute">— {g.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
