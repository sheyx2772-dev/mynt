"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";

export type CarouselItem = {
  href: string;
  /** A photograph of the object, cut out. */
  src?: string;
  /** Or the thing drawn rather than photographed — the card range, as it is
   *  already drawn under the order button, handed in whole. */
  node?: React.ReactNode;
  name: string;
  price: string;
};

/**
 * The objects a number can be issued on, one at a time, suspended.
 *
 * The number is what is being sold; these are what carry it. So they take one
 * position and take turns in it rather than being laid out as a range — a row
 * of five asks the visitor to choose before they have decided to buy anything,
 * and the point of this spot is that any of them will do.
 *
 * Everything holds still for anyone who asked their system not to animate, and
 * the turn stops while a pointer is over it, since moving a link out from under
 * somebody about to click it is the whole reason carousels are disliked.
 */
export default function FloatingCarousel({
  items,
  everyMs = 3800,
}: {
  items: CarouselItem[];
  everyMs?: number;
}) {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (items.length < 2 || held) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setAt((i) => (i + 1) % items.length),
      everyMs,
    );
    return () => window.clearInterval(id);
  }, [items.length, everyMs, held]);

  const current = items[at];

  return (
    <div
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
    >
      <Link href={current.href} aria-label={current.name} className="group relative block select-none">
        {/* The light the object hangs in. Without it the cutout reads as
            pasted onto the dark rather than lit by the page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
          style={{
            background:
              "radial-gradient(55% 45% at 50% 42%, rgba(171,255,9,0.14), transparent 70%)",
          }}
        />

        {/* All of them are mounted and only one is opaque, so the swap is a
            cross-fade with nothing to load at the moment it happens. */}
        <div className="relative aspect-[3/2] w-full">
          {items.map((it, i) => {
            const shown = i === at;
            const fade = `transition-opacity duration-700 ${shown ? "opacity-100" : "opacity-0"}`;

            // A drawn slide is handed in whole and gets no drop shadow of its
            // own — it brings its own, and doubling them reads as a smudge.
            return it.node ? (
              <div
                key={`node-${i}`}
                aria-hidden={!shown}
                className={`float-bob absolute inset-0 flex items-center justify-center ${fade}`}
              >
                {it.node}
              </div>
            ) : (
              <Image
                key={it.src}
                src={it.src!}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 26rem, 80vw"
                className={`float-bob object-contain drop-shadow-[0_28px_40px_rgba(0,0,0,0.55)] ${fade}`}
              />
            );
          })}
        </div>

        <div
          aria-hidden
          className="float-cast mx-auto mt-[-4%] h-[7%] w-[58%] rounded-[50%] bg-black/55 blur-xl"
        />

        <p className="mt-5 flex items-baseline justify-center gap-2 text-center">
          <span className="text-sm font-semibold">{current.name}</span>
          <span className="font-tabular text-xs opacity-55">{current.price}</span>
        </p>
      </Link>

      {items.length > 1 && (
        <p className="mt-3 text-center font-tabular text-[11px] opacity-40">
          {at + 1} / {items.length}
        </p>
      )}

    </div>
  );
}
