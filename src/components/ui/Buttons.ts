// The three shapes a control takes on the paper face.
//
// They are objects on a sheet, not rectangles on a page: `ink` stands up off
// the paper and moves down a pixel when pressed, `paper` is already pressed
// into it, and `lime` is `ink` in the one colour a screen is allowed once.
//
// Lime is a budget, not a palette entry. It marks the single thing a screen
// exists for; a second one spends it on nothing. It is never text, never a
// border, never an icon — on white it sits at 1.2:1 and cannot be read at all.

const BASE =
  "flex h-14 items-center justify-center gap-2.5 rounded-xl text-[16px] transition-transform duration-[120ms]";

export const button = {
  lime: `${BASE} bg-lime font-semibold text-ink shadow-slab active:translate-y-px active:shadow-none`,
  ink: `${BASE} bg-ink font-semibold text-paper shadow-slab active:translate-y-px active:shadow-none`,
  paper: `${BASE} bg-ink/[0.04] px-3 font-medium text-ink shadow-deboss active:bg-ink/10`,
} as const;
