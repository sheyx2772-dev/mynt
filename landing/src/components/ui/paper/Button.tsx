// The paper face's button.
//
// 52px tall, because the person pressing it is standing up, outdoors, possibly
// in gloves. Full width in the places it matters — a button somebody has to aim
// at is a button somebody misses.
//
// There is exactly one `primary` per screen. Lime is not a colour here, it is a
// budget: it marks the single thing this screen exists for, and a second lime
// spends it on nothing. Everything else that could be tempted into lime — the
// focus ring, a chosen chip, a link, a "new" dot — is ink instead.

const BASE =
  "inline-flex items-center justify-center gap-2 h-[52px] px-5 rounded-full text-[16px] font-semibold select-none transition-[transform,background-color] duration-[120ms] ease-[var(--ease-out)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-fill disabled:text-ink-3 disabled:active:scale-100";

export const paperButton = {
  primary: `${BASE} bg-lime text-ink active:bg-lime-press`,
  secondary: `${BASE} bg-white text-ink border border-line-2 active:bg-fill`,
  ghost: `${BASE} bg-transparent text-ink-2 h-11 px-3`,
} as const;

export type PaperButtonVariant = keyof typeof paperButton;
