import type { CSSProperties } from "react";

// The looks a profile can open in, as a catalogue the picker reads.
//
// `lib/profile/theme.ts` owns what a theme *is* — nine custom properties the
// public components read. This file owns what a theme is *called* and how it
// is *shown* before it is chosen: a name, a family, and the three colours a
// swatch needs. The two are kept apart so that thirty entries here stay a
// catalogue, not thirty rendering rules.
//
// Designed for thirty, not for the ten that exist. Every theme carries a
// family, and the picker filters by family and by name before it draws a
// grid — so the thirtieth theme is a row in this table and nothing else. The
// id is what the backend stores in `handles.dizayn` and validates against its
// own list (`internal/handles/plans.go`); an id missing there is saved as
// "genesis" without a word, so the two lists are the same ten on purpose.
//
// Colours are brand tokens by name. A theme picks from the palette and never
// invents, which is what keeps thirty of them looking like one product.

export type ThemeFamily = "ink" | "metal" | "pattern" | "paper";

export type ThemeEntry = {
  id: string;
  name: string;
  family: ThemeFamily;
  /** The swatch, as the same variables the real theme sets. */
  swatch: CSSProperties;
};

const ink = (accent: string): CSSProperties =>
  ({
    "--p-ground": "var(--color-ink)",
    "--p-surface": "var(--color-ink-s1)",
    "--p-text": "var(--color-paper)",
    "--p-accent": accent,
  }) as CSSProperties;

const paper = (accent: string): CSSProperties =>
  ({
    "--p-ground": "var(--color-paper)",
    "--p-surface": "var(--card)",
    "--p-text": "var(--color-ink)",
    "--p-accent": accent,
  }) as CSSProperties;

export const THEMES: ThemeEntry[] = [
  {
    id: "genesis",
    name: "Genesis",
    family: "ink",
    swatch: ink("var(--color-lime)"),
  },
  { id: "lime", name: "Lime", family: "ink", swatch: ink("var(--color-lime)") },
  {
    id: "grid",
    name: "Grid",
    family: "ink",
    swatch: ink("var(--color-paper-2)"),
  },
  {
    id: "sheen",
    name: "Sheen",
    family: "metal",
    swatch: ink("var(--color-line-2)"),
  },
  {
    id: "rahbar",
    name: "Rahbar",
    family: "metal",
    swatch: ink("var(--color-gold)"),
  },
  {
    id: "devops",
    name: "DevOps",
    family: "ink",
    swatch: ink("var(--color-lime-ink)"),
  },
  {
    id: "naqsh",
    name: "Naqsh",
    family: "pattern",
    swatch: ink("var(--color-gold)"),
  },
  {
    id: "suzani",
    name: "Suzani",
    family: "pattern",
    swatch: paper("var(--color-danger)"),
  },
  {
    id: "xarita",
    name: "Xarita",
    family: "pattern",
    swatch: paper("var(--color-ink-2)"),
  },
  {
    id: "paper",
    name: "Paper",
    family: "paper",
    swatch: paper("var(--color-ink)"),
  },
];

export const FAMILIES: ThemeFamily[] = ["ink", "metal", "pattern", "paper"];

export function themeEntry(id: string): ThemeEntry {
  // The same fallback the backend applies on write, so the picker never shows
  // a selection the server would not keep.
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
