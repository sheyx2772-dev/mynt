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
            className="group relative w-[58vw] max-w-[15rem] shrink-0 snap-start overflow-hidden rounded-3xl bg-flex-black ring-1 ring-white/10"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              {/* A phone, because at this size the preview is a crop and reads
                  as a fragment without one — the frame is what says "screen".
                  A full-width preview needs no frame: the reader is holding the
                  phone already. A thumbnail does.
                  No fake status bar and no fake clock: those are the parts that
                  make a device mockup look like a stock photograph. */}
              <div className="pointer-events-none absolute inset-x-0 top-5 flex justify-center">
                <div className="relative h-[260px] w-[132px] overflow-hidden rounded-[1.35rem] bg-black shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/15">
                  <div
                    aria-hidden
                    className="absolute top-0 left-1/2 w-[380px] origin-top -translate-x-1/2 scale-[0.347]"
                  >
                    {l.render()}
                  </div>
                  {/* The cutout, drawn small enough to read as one rather than
                      as a black bar across the top. */}
                  <div className="absolute top-1.5 left-1/2 h-[7px] w-[38px] -translate-x-1/2 rounded-full bg-black/85" />
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-flex-black via-flex-black/90 to-transparent px-4 pt-10 pb-3">
                <p className="font-display text-base leading-tight font-semibold text-white">
                  {l.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[11px] tracking-wide text-white/45 uppercase">
                  {l.who}
                </p>
              </div>
            </div>

            <div className="pointer-events-none flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm font-medium text-lime">{open}</span>
              <ChevronRight className="h-4 w-4 text-white/35 transition-transform group-hover:translate-x-0.5" />
            </div>

            <Link
              href="/katalog?bolim=layouts"
              aria-label={l.name}
              className="absolute inset-0 rounded-3xl transition-transform active:scale-[0.99]"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
