import Link from "next/link";
import { ArrowRight, User, Store } from "lucide-react";
import type { site } from "@/lib/i18n";

// The fork, said out loud at the entrance.
//
// Both products were reachable and neither was announced: the personal side
// was simply what the page was about, and the business side was a link in a
// header and a card two thirds of the way down. Somebody who runs a cafe had
// to work out that this site was also for them.
//
// So the two are stated as two, side by side, before anything else is
// explained. The contrast is carried by the cards themselves — one on paper,
// one on the brand's ink — because a person deciding which of two things they
// are should be able to see that there are two before reading a word.

type Site = ReturnType<typeof site>;

export default function TwoWays({ s }: { s: Site }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-12 pb-14 sm:pt-16 sm:pb-20">
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-[11px] font-medium tracking-wide text-flex-black/60 uppercase">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-ink" />
        {s.heroBadge}
      </p>

      <h1 className="max-w-2xl font-display text-[2.2rem] leading-[1.06] font-semibold tracking-tight text-balance sm:text-5xl">
        {s.heroTitleA && <>{s.heroTitleA} </>}
        <span className="rounded-md bg-lime px-2 text-flex-black">{s.heroTitleMark}</span>{" "}
        {s.heroTitleB}
      </h1>

      <p className="mt-8 mb-4 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
        {s.waysEyebrow}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link
          href="/#narx"
          className="group flex flex-col rounded-3xl bg-lime p-7 text-flex-black shadow-[0_24px_60px_-30px_rgba(171,255,9,0.85)] transition-transform hover:-translate-y-0.5 sm:p-8"
        >
          <User className="h-6 w-6 text-flex-black/70" strokeWidth={1.6} />
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {s.wayPersonal}
          </h2>
          <p className="mt-3 flex-1 leading-relaxed text-flex-black/70">
            {s.wayPersonalDesc}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
            {s.wayPersonalCta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/biznes"
          className="grain group relative flex flex-col overflow-hidden rounded-3xl bg-flex-black p-7 text-white transition-transform hover:-translate-y-0.5 sm:p-8"
        >
          <div className="bg-dot-grid-light absolute inset-0 opacity-30" />
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-lime/[0.13] blur-[90px]" />

          <Store className="relative h-6 w-6 text-lime" strokeWidth={1.6} />
          <h2 className="relative mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {s.wayBusiness}
          </h2>
          <p className="relative mt-3 flex-1 leading-relaxed text-white/60">
            {s.wayBusinessDesc}
          </p>
          <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium text-lime">
            {s.wayBusinessCta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}
