import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

// A shelf that drifts.
//
// The picker page lays everything out at once, which is right when somebody
// went looking. On the entry page nobody went looking yet, so the shelf does
// the looking for them.
//
// It used to be a scroller that stepped one card every few seconds, and it
// only ever moved on a phone: the step was a `scrollTo`, and four cards fit
// inside a desktop rail with room left over, so there was nothing to scroll
// and it sat still. It is a marquee now — the track holds the items twice and
// travels exactly half its own width, so the loop has no seam and the width of
// the window has nothing to do with whether it moves.
//
// It stops under a cursor and never runs for anyone who asked their system not
// to animate. See `.drift` in globals.css.

export type StripItem = {
  href: string;
  src: string | null;
  name: string;
  note: string;
  price: string;
};

function Card({ item, clone }: { item: StripItem; clone?: boolean }) {
  return (
    <Link
      href={item.href}
      // The second copy exists to fill the seam, not to be read twice: a
      // screen reader and the tab order see one shelf.
      {...(clone ? { "aria-hidden": true, tabIndex: -1 } : {})}
      className="group relative mr-3 w-[58vw] max-w-[15rem] shrink-0 overflow-hidden rounded-tile bg-flex-black ring-1 ring-white/10 transition-transform active:scale-[0.99]"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {item.src ? (
          <Image
            src={item.src}
            alt={clone ? "" : item.name}
            fill
            sizes="15rem"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#211a3c_0%,#0b0817_70%)]" />
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-flex-black via-flex-black/70 to-transparent px-4 pt-10 pb-3">
          <p className="font-display text-base leading-tight font-semibold text-white">
            {item.name}
          </p>
          <p className="mt-0.5 text-[11px] tracking-wide text-paper-3 uppercase">
            {item.note}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-tabular text-sm font-medium text-lime">{item.price}</span>
        <ChevronRight className="h-4 w-4 text-paper-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function LoadoutStrip({
  items,
  label,
  note,
}: {
  items: readonly StripItem[];
  label: string;
  note: string;
}) {
  // One speed, whatever the shelf holds: a row of four and a row of fourteen
  // should travel at the same pace, so the duration follows the length.
  const seconds = Math.max(18, items.length * 7);

  return (
    <section className="py-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-baseline justify-between gap-4 px-6">
        <h2 className="font-display text-lime-ink text-xs font-semibold tracking-widest uppercase">
          {label}
        </h2>
        <p className="text-xs text-ink-3">{note}</p>
      </div>

      <div className="drift-hold overflow-hidden">
        <div
          className="drift flex w-max pl-6"
          style={{ "--drift": `${seconds}s` } as React.CSSProperties}
        >
          {items.map((item) => (
            <Card key={item.href + item.name} item={item} />
          ))}
          {items.map((item) => (
            <Card key={`clone-${item.href}${item.name}`} item={item} clone />
          ))}
        </div>
      </div>
    </section>
  );
}
