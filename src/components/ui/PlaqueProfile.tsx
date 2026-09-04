import { Nfc } from "lucide-react";

import Plate from "@/components/ui/Plate";

// The ceremonial layout.
//
// The other one is a card with paperwork slid under it: left-aligned, sans,
// solid buttons, a white sheet. It is right for somebody handing a card to a
// client, and wrong for everybody else — a photographer, a restaurant, a
// person who bought the number because it is a good number does not want a
// form. They want a certificate.
//
// So this is built differently rather than painted differently. Centred on its
// axis. A serif for the name. Hairline outlined pills instead of struck slabs.
// A round portrait in a ring instead of a square print. No sheet at all: the
// page is one panel, the way a certificate is one piece of card, with a rule
// inset from its edge the way an engraved invitation has one.
//
// This is the difference between a theme and a design. Nine palettes on one
// arrangement is a set of paint tins.

export default function PlaqueProfile({
  n,
  name,
  role,
  company,
  bio,
  avatarUrl,
  children,
}: {
  n: string;
  name: string;
  role?: string | null;
  company?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  /** The rows — contacts, services — rendered by the caller. */
  children?: React.ReactNode;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="mx-auto w-full max-w-[460px] px-4 py-8">
      {/* The rule sits inset from the panel's edge rather than on it. That
          is what makes a printed certificate look printed: the border is not
          the trim, it is a line struck inside the trim. */}
      <div className="rounded-[20px] border border-gold/25 p-1.5">
        <div className="rounded-[15px] border border-dashed border-gold/25 px-5 py-9 text-center">
          <div className="flex items-center justify-center gap-3 text-gold/70">
            <span className="h-px w-8 bg-gold/40" aria-hidden />
            <span className="font-serif text-[16px] tracking-[0.32em] uppercase">
              Flex
            </span>
            <Nfc className="size-4 rotate-90" />
            <span className="h-px w-8 bg-gold/40" aria-hidden />
          </div>

          <div className="mt-7 flex justify-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
              <img
                src={avatarUrl}
                alt={name}
                width={104}
                height={104}
                className="size-26 rounded-full border-2 border-gold/40 object-cover"
              />
            ) : (
              <div className="flex size-26 items-center justify-center rounded-full border-2 border-gold/40 font-serif text-[34px] text-gold">
                {initials}
              </div>
            )}
          </div>

          {/* Serif, and large, because on this layout the name is the whole
              headline rather than a label above a list. */}
          <h1 className="mt-6 font-serif text-[34px] leading-tight text-balance">
            {name}
          </h1>

          {(role || company) && (
            <p className="mt-2 text-[16px] leading-6 tracking-[0.08em] text-mute uppercase">
              {[role, company].filter(Boolean).join(" · ")}
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <Plate n={n} size="md" mark={false} />
          </div>

          {bio && (
            <p className="mx-auto mt-6 max-w-[34ch] font-serif text-[18px] leading-relaxed text-pretty">
              {bio}
            </p>
          )}

          <div className="mt-8 flex items-center justify-center gap-3 text-gold/40">
            <span className="h-px w-12 bg-gold/30" aria-hidden />
            <span className="text-[16px]">✦</span>
            <span className="h-px w-12 bg-gold/30" aria-hidden />
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** The outlined pill this layout uses instead of a struck slab. */
export const plaquePill =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-gold/45 px-5 py-2 font-serif text-[16px] font-bold tracking-[0.06em] text-gold uppercase transition-colors active:bg-gold/10";
