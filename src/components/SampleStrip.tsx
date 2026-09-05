import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { LAYOUTS } from "@/components/ui/LayoutSamples";

/**
 * The profile layouts, one tile each, on the same rail as the devices and the
 * verticals.
 *
 * Each tile shows the layout itself rather than a picture of it — the same
 * components the bench draws, scaled down and clipped to the tile's top. A
 * screenshot would be lighter and would go stale the first time a layout
 * changed; this cannot.
 *
 * The top is what is shown because that is where the layouts differ: the band,
 * the portrait, the way the name sits. Everything below the fold of a tile is
 * the same four buttons in a different order.
 */
export default function SampleStrip({
  label,
  note,
  open,
}: {
  label: string;
  note: string;
  open: string;
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
        {LAYOUTS.map((l) => (
          // Not a <Link> around the whole tile: the layouts carry their own
          // anchors — a location pin, a website button — and an anchor inside
          // an anchor is invalid HTML, which React refuses to hydrate. The
          // link is laid over the tile instead, as a sibling of the preview.
          <div
            key={l.name}
            className="group relative w-[78vw] max-w-[17.5rem] shrink-0 snap-start"
          >
            {/* A phone at something like a phone's size, not a thumbnail of
                one. Shrunk into a square tile the layout was unreadable, which
                defeats the point of showing it at all — so the frame takes the
                width it needs and the shelf scrolls. */}
            {/* 9:16 rather than a phone's true 9:19.5. Measured: the layouts
                render between 498 and 738px inside a 280px-wide frame, so a
                taller box leaves the three shortest with a black band under
                them. A screen that ends in black reads as broken; a slightly
                stubby phone does not. The long ones are clipped, which is what
                a screen does anyway. */}
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[2rem] bg-black shadow-[0_22px_50px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 left-0 w-[380px] origin-top-left"
                style={{ transform: "scale(var(--sample-scale, 0.71))" }}
              >
                {l.render()}
              </div>

              {/* The cutout, small enough to read as one rather than as a bar. */}
              <div className="pointer-events-none absolute top-2 left-1/2 h-[9px] w-[54px] -translate-x-1/2 rounded-full bg-black/85" />
            </div>

            <div className="mt-3 px-1">
              <p className="font-display text-[15px] leading-tight font-semibold">
                {l.name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-flex-black/50">
                {l.who}
              </p>
              <p className="mt-2 flex items-center gap-1 text-sm font-medium text-lime-ink">
                {open}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>

            <Link
              href="/katalog?bolim=layouts"
              aria-label={l.name}
              className="absolute inset-0 rounded-[2rem]"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
