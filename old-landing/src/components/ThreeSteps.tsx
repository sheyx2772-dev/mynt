import Image from "next/image";
import { Nfc } from "lucide-react";

import type { site } from "@/lib/i18n";

type Site = ReturnType<typeof site>;

// How the thing works, in three.
//
// It was written twice: once here, on /shaxsiy, drawn on dark stages with the
// number struck into the first of them — and once on the entry page, three
// photographs on white cards with a different heading and a different set of
// sentences. The entry page is where most people meet the explanation for the
// first time, and it had the weaker of the two.
//
// One block now, on both. The illustrations fall back to drawings when a
// photograph is missing, which is why step one has no photograph at all: the
// number is the product, and a rendering of it is more honest than a stock
// photograph of a card.
export default function ThreeSteps({
  s,
  familyShot,
  tapShot,
}: {
  s: Site;
  /** The card, ring and bracelet together. Drawn when the file is absent. */
  familyShot: string | null;
  /** A card meeting a phone. Drawn when the file is absent. */
  tapShot: string | null;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <p className="mb-3 text-ink-3 text-xs font-semibold tracking-widest uppercase">
        {s.howItWorks}
      </p>
      <h2 className="max-w-lg font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
        {s.threeSteps}
      </h2>

      <ol className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-3">
        <li>
          <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-card bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
            <div className="relative flex overflow-hidden rounded-input border border-ink-line font-display text-xl font-semibold text-white">
              <span className="px-3 py-2">MYN</span>
              <span className="w-px bg-white/15" />
              <span className="bg-lime px-3 py-2 font-tabular text-flex-black">
                042
              </span>
            </div>
          </div>
          <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-ink-3">
            01
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            {s.pickHandle}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            {s.stepHandleDesc}
          </p>
        </li>

        <li>
          <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-card bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
            {familyShot ? (
              <Image
                src={familyShot}
                alt="Flex karta, uzuk va braslet"
                fill
                sizes="(min-width: 640px) 20rem, 100vw"
                className="object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-x-0 -top-8 h-32 bg-lime/10 blur-3xl" />
                {/* Card, ring, bracelet — three silhouettes, each given one
                lime mark so a black object stays legible on a black stage. */}
                <div className="relative flex items-center gap-4">
                  <span className="relative h-16 w-24 rotate-[-8deg] rounded-plate border border-paper-3 bg-[linear-gradient(140deg,#2b2250,#0c0818)] shadow-[0_18px_32px_-14px_rgba(0,0,0,0.95)]">
                    <span className="absolute bottom-2 left-2 h-1 w-6 rounded-full bg-lime" />
                  </span>
                  <span className="h-16 w-16 rounded-full border-[6px] border-paper-3 bg-[linear-gradient(140deg,#312653,#0c0818)]" />
                  <span className="relative h-20 w-9 rotate-[6deg] rounded-full border border-paper-3 bg-[linear-gradient(140deg,#2b2250,#0c0818)] shadow-[0_18px_32px_-14px_rgba(0,0,0,0.95)]">
                    <span className="absolute top-1/2 left-1/2 h-6 w-4 -translate-x-1/2 -translate-y-1/2 rounded-[40%] bg-black ring-1 ring-lime/60" />
                  </span>
                </div>
              </>
            )}
          </div>
          <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-ink-3">
            02
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            {s.pickDevice}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            {s.pickDeviceDesc}
          </p>
        </li>

        <li>
          <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-card bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
            {tapShot ? (
              <Image
                src={tapShot}
                alt="Kartani telefonga tegizish"
                fill
                sizes="(min-width: 640px) 20rem, 100vw"
                className="object-cover"
              />
            ) : (
              <>
                {/* Concentric rings: the tap, drawn. */}
                <span className="absolute h-16 w-16 rounded-full border border-lime/25" />
                <span className="absolute h-28 w-28 rounded-full border border-lime/15" />
                <span className="absolute h-44 w-44 rounded-full border border-lime/10" />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-lime">
                  <Nfc className="h-5 w-5 text-flex-black" />
                </span>
              </>
            )}
          </div>
          <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-ink-3">
            03
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            {s.stepTap}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            {s.stepTapDesc}
          </p>
        </li>
      </ol>
    </section>
  );
}
