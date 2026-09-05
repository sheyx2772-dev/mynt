import { ArrowUpRight } from "lucide-react";

import Plate from "@/components/ui/Plate";

// The poster.
//
// One thing very large and everything else out of the way. The name runs to
// the edges at a size nothing else on the page competes with, and the links
// are a stack of full-width rules underneath it — no boxes, no icons, no
// shadows, nothing raised off the surface at all.
//
// The other layouts are objects: a card on a desk, a certificate, a grid of
// tiles. This one is flat on purpose. It suits a name that is the whole
// product — a musician, a brand, somebody whose number is on a poster in a
// window — and it is the only arrangement here that reads at four metres.
//
// The name is set in the display face at a size taken from the viewport
// rather than from a scale, so it fills the width it is given on a 360px
// phone and on a laptop alike.

type Row = { label: string; value: string; href: string };

export default function PosterProfile({
  n,
  name,
  role,
  rows,
  children,
}: {
  n: string;
  name: string;
  role?: string | null;
  rows: Row[];
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[460px] px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[16px] font-bold tracking-[0.22em] uppercase">
          Flex
        </span>
        <Plate n={n} size="sm" mark={false} />
      </div>

      {/* Set from the viewport, not from a type scale: on a poster the name is
          measured against the paper it is printed on. */}
      <h1 className="mt-10 text-[clamp(46px,15vw,72px)] leading-[0.92] font-bold tracking-[-0.04em] uppercase text-balance">
        {name}
      </h1>

      {role && (
        <p className="mt-5 text-[16px] leading-6 tracking-[0.16em] text-mute uppercase">
          {role}
        </p>
      )}

      <div className="mt-10 h-px w-full bg-ink" />

      {/* Rules, not buttons. Nothing here is raised off the page; the only
          thing with any weight on this layout is the name. */}
      <ul>
        {rows.map((r) => (
          <li key={r.label}>
            <a
              href={r.href}
              className="flex min-h-16 items-baseline gap-4 border-b border-ink/15 py-4 active:bg-ink/5"
            >
              <span className="w-[9ch] shrink-0 text-[16px] tracking-[0.12em] text-mute uppercase">
                {r.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-[18px] font-medium">
                {r.value}
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-mute" />
            </a>
          </li>
        ))}
      </ul>

      {children}
    </div>
  );
}
