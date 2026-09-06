import type { CSSProperties } from "react";

import type { CardDesignId } from "@/lib/card-designs";

// How each design is painted.
//
// Apart from `card-designs.ts` on purpose: that file says what may be ordered,
// this one says what it looks like. A design is a fact about the catalogue and
// survives a redesign of the drawing; a gradient is not.
//
// Every colour here is a token from `globals.css`, reached through
// `color-mix()` rather than written as `rgba(…)`. A gradient is the one place a
// palette quietly grows a private colour — the old site's card faces carried
// six that appear nowhere else in the product — and `color-mix` means a change
// to the brand lime reaches the card faces along with everything else.

export type CardSkin = {
  /** The ground, as Tailwind classes. Shown alone while artwork loads. */
  ground: string;
  /** Ink on a light ground rather than paper on a dark one. */
  light?: boolean;
  /** The texture drawn over the ground. Absent for the artwork-backed designs. */
  overlay?: CSSProperties;
};

// Two hatches at 3px and 4px, running against each other. One hatch is a
// weave; two with periods that do not divide beat at a much longer interval,
// and that irregularity is what reads as grain rather than as fabric.
const GRAIN: CSSProperties = {
  backgroundImage: [
    "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-paper) 5%, transparent) 0 1px, transparent 1px 3px)",
    "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-paper) 4%, transparent) 0 1px, transparent 1px 4px)",
  ].join(","),
};

const DOTS: CSSProperties = {
  backgroundImage:
    "radial-gradient(color-mix(in srgb, var(--color-paper) 18%, transparent) 1px, transparent 1.2px)",
  backgroundSize: "12px 12px",
};

const SHEEN: CSSProperties = {
  backgroundImage:
    "linear-gradient(115deg, transparent 30%, color-mix(in srgb, var(--color-lime) 22%, transparent) 48%, transparent 62%)",
};

// Two square lattices, one turned 45 degrees. That is how an eight-pointed
// star is constructed, and drawing it as construction lines rather than as a
// traced motif is what keeps it our own drawing instead of somebody's tile.
const NAQSH: CSSProperties = {
  backgroundImage: [
    "repeating-linear-gradient(0deg, color-mix(in srgb, var(--color-lime) 16%, transparent) 0 1px, transparent 1px 34px)",
    "repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-lime) 16%, transparent) 0 1px, transparent 1px 34px)",
    "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-paper) 10%, transparent) 0 1px, transparent 1px 24px)",
    "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-paper) 10%, transparent) 0 1px, transparent 1px 24px)",
  ].join(","),
};

// The artwork-backed four all sit on plain ink rather than on the colour their
// own picture is darkest in. The old site kept a hex per design for that, which
// is four colours maintained to be seen during a decode — the artwork fills the
// frame, so the ground is only ever the flash before it arrives.
export const SKINS: Record<CardDesignId, CardSkin> = {
  genesis: { ground: "bg-ink", overlay: GRAIN },
  lime: { ground: "bg-lime", light: true },
  grid: { ground: "bg-ink", overlay: DOTS },
  sheen: { ground: "bg-ink", overlay: SHEEN },
  naqsh: { ground: "bg-ink", overlay: NAQSH },
  // The one card that is nearly nothing: white, and found by its edge alone.
  paper: { ground: "bg-white ring-1 ring-line-2 ring-inset", light: true },
  rahbar: { ground: "bg-ink" },
  devops: { ground: "bg-ink" },
  suzani: { ground: "bg-ink" },
  xarita: { ground: "bg-ink" },
};
