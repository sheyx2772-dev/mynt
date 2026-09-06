import type { CSSProperties } from "react";

/**
 * The look a profile opens in.
 *
 * A number is bought once and kept for life, and the card it is engraved on is
 * chosen. So the look belongs to the card rather than to a setting somebody
 * flips: whoever paid for the gold engraving should see gold when a stranger
 * taps it, and that is a rank the competitor cannot copy without making the
 * cards too.
 *
 * Only one look is built. The seam is here so the next six are a table entry
 * rather than a rewrite: a theme is nine custom properties, the components read
 * those and only those, and none of them knows a theme exists. Adding
 * "registon" means adding a constant below and a line to `BY_DESIGN` — no
 * component is opened, and nothing that is already right can break.
 *
 * The values are the brand tokens from `globals.css` by name. A theme picks
 * from the palette; it does not invent colours, which is what keeps seven of
 * them looking like one product.
 */
export type ProfileTheme = {
  id: string;
  /** Set once, on the wrapper. Everything below reads `var(--p-*)`. */
  style: CSSProperties;
};

/** Ink ground, lime accent — the face the card series is printed in. */
const TUNGI: ProfileTheme = {
  id: "tungi",
  style: {
    "--p-ground": "var(--color-ink)",
    "--p-surface": "var(--color-ink-s1)",
    "--p-surface-2": "var(--color-ink-s2)",
    "--p-line": "var(--color-ink-line)",
    "--p-text": "var(--color-paper)",
    "--p-text-2": "var(--color-paper-2)",
    "--p-text-3": "var(--color-paper-3)",
    "--p-accent": "var(--color-lime)",
    "--p-on-accent": "var(--color-ink)",
  } as CSSProperties,
};

/**
 * Card design → look. Empty on purpose: every design opens in `TUNGI` today.
 *
 * Keyed by the design id the backend stores in `dizayn` ("genesis", "naqsh",
 * "suzani", …), not by a theme name, so the mapping stays the one fact this
 * file owns.
 */
const BY_DESIGN: Record<string, ProfileTheme> = {};

export function themeFor(dizayn?: string): ProfileTheme {
  // An unknown design is a design shipped after this build, not an error. It
  // opens in the default rather than in a broken page.
  return (dizayn && BY_DESIGN[dizayn]) || TUNGI;
}
