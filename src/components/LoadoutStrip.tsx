"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { shouldAdvance, nextScrollLeft, QUIET_MS, STEP_MS } from "@/lib/carousel";

// A shelf that moves.
//
// The picker page lays everything out at once, which is right when somebody
// went looking. On the entry page nobody went looking yet, so the strip does
// the looking for them: it drifts one card at a time and stops the moment a
// finger or a cursor arrives, because a carousel that keeps moving while you
// are reading is worse than no carousel.
//
// It never moves for anyone who asked their system not to animate, and it
// never moves while the tab is hidden — an animation nobody is watching is
// battery spent for nothing.

export type StripItem = {
  href: string;
  src: string | null;
  name: string;
  note: string;
  price: string;
};

export default function LoadoutStrip({
  items,
  label,
  note,
}: {
  items: readonly StripItem[];
  label: string;
  note: string;
}) {
  const rail = useRef<HTMLDivElement>(null);

  // A timestamp rather than a boolean, and a ref rather than state.
  //
  // The first version held a `paused` flag set on pointerenter and cleared on
  // pointerleave, and it got stuck: one leave that never arrived — a cursor
  // that left through a child, a synthetic event, a tab switch mid-hover — and
  // the strip stopped for good. Nothing here can fail to be un-set, because
  // nothing has to arrive: the pause expires on its own.
  const quietUntil = useRef(0);

  function hold() {
    quietUntil.current = Date.now() + QUIET_MS;
  }

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const id = window.setInterval(() => {
      const el = rail.current;
      if (!el) return;

      const allowed = shouldAdvance({
        hidden: document.hidden,
        reducedMotion: reduced.matches,
        now: Date.now(),
        quietUntil: quietUntil.current,
      });
      if (!allowed) return;

      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;

      // A card plus the gap. Measured rather than assumed, because the card
      // width is a viewport fraction and changes with the window.
      const gap = Number.parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      const step = card.offsetWidth + gap;

      el.scrollTo({
        left: nextScrollLeft(el.scrollLeft, el.clientWidth, el.scrollWidth, step),
        behavior: "smooth",
      });
    }, STEP_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="py-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-baseline justify-between gap-4 px-6">
        <h2 className="font-display text-xs font-semibold tracking-widest text-lime-ink uppercase">
          {label}
        </h2>
        <p className="text-xs text-flex-black/40">{note}</p>
      </div>

      <div
        ref={rail}
        onPointerDown={hold}
        onPointerMove={hold}
        onTouchStart={hold}
        onTouchMove={hold}
        onFocusCapture={hold}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scroll-padding-left:1.5rem]"
      >
        {items.map((item) => (
          <Link
            key={item.href + item.name}
            href={item.href}
            className="group relative w-[58vw] max-w-[15rem] shrink-0 snap-start overflow-hidden rounded-3xl bg-flex-black ring-1 ring-white/10 transition-transform active:scale-[0.99]"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              {item.src ? (
                <Image
                  src={item.src}
                  alt={item.name}
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
                <p className="mt-0.5 text-[11px] tracking-wide text-white/45 uppercase">
                  {item.note}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-tabular text-sm font-medium text-lime">{item.price}</span>
              <ChevronRight className="h-4 w-4 text-white/35 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
