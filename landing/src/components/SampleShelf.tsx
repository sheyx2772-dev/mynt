import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * A shelf of samples, and the tile that sits on it.
 *
 * Two shelves use these: the seven layouts, and the organisations. They are
 * read as one row of samples one after the other, so they share the frame
 * rather than each carrying its own copy — a tile that was a different size on
 * the second shelf would read as a different kind of thing.
 */
export function SampleShelf({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="py-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-baseline justify-between gap-4 px-6">
        <h2 className="font-display text-xs font-semibold tracking-widest text-lime-ink uppercase">
          {label}
        </h2>
        <p className="text-xs text-flex-black/40">{note}</p>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scroll-padding-left:1.5rem]">
        {children}
      </div>
    </section>
  );
}

export function SampleTile({
  href,
  name,
  who,
  open,
  children,
}: {
  href: string;
  name: string;
  who: string;
  open: string;
  children: ReactNode;
}) {
  return (
    // Not a <Link> around the whole tile: the samples carry their own anchors
    // — a location pin, a website button — and an anchor inside an anchor is
    // invalid HTML, which React refuses to hydrate. The link is laid over the
    // tile instead, as a sibling of the preview.
    <div className="group relative w-[86vw] max-w-[21.5rem] shrink-0 snap-start">
      {/* The tile is nearly the whole screen wide and the sample draws at that
          width unscaled — every one of them is fluid, so this is the same
          rendering a phone gets, at the same type size, not a shrunken copy of
          it. Scaled to 0.71 in a narrower tile it was legible but small, which
          is not what a sample is for.

          1:2 rather than a phone's true 9:19.5. Measured at 338px wide: the
          seven layouts run 686 to 1064px tall, so a frame cut to 19.5 leaves
          the shortest sitting above a black band, and a screen that ends in
          black reads as broken. 1:2 is 676px — under all of them — so each
          fills its frame and the long ones are clipped, which is what a screen
          does to a page anyway. */}
      <div className="relative aspect-[1/2] w-full overflow-hidden rounded-[2rem] bg-black shadow-[0_22px_50px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
        >
          {children}
        </div>

        {/* The cutout, small enough to read as one rather than as a bar. */}
        <div className="pointer-events-none absolute top-2 left-1/2 h-[9px] w-[54px] -translate-x-1/2 rounded-full bg-black/85" />
      </div>

      <div className="mt-3 px-1">
        <p className="font-display text-[15px] leading-tight font-semibold">
          {name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-flex-black/50">
          {who}
        </p>
        <p className="mt-2 flex items-center gap-1 text-sm font-medium text-lime-ink">
          {open}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>

      <Link
        href={href}
        aria-label={name}
        className="absolute inset-0 rounded-[2rem]"
      />
    </div>
  );
}
