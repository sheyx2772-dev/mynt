// When a moving shelf is allowed to move.
//
// Pulled out of the component because it is the part that can be wrong, and
// the part a browser cannot be made to demonstrate on demand: an automated tab
// backgrounds itself between calls, so `document.hidden` is true for most of
// any measurement and the pause can never be observed cleanly. The rule is
// testable even when the plumbing around it is not.

export type AdvanceInput = {
  /** document.hidden — nobody is looking, so nothing should move. */
  hidden: boolean;
  /** prefers-reduced-motion: reduce. */
  reducedMotion: boolean;
  /** Date.now() at the moment the tick fires. */
  now: number;
  /** Set to now + QUIET_MS by any touch or cursor movement over the rail. */
  quietUntil: number;
};

/** How long a touch or a cursor keeps the shelf still after the last one. */
export const QUIET_MS = 6000;

/** How often the shelf steps, when it is allowed to. */
export const STEP_MS = 3600;

export function shouldAdvance({
  hidden,
  reducedMotion,
  now,
  quietUntil,
}: AdvanceInput): boolean {
  if (reducedMotion) return false;
  if (hidden) return false;
  return now >= quietUntil;
}

/**
 * Where the rail goes next: one card along, or back to the start once the last
 * one is in view. The wrap is what makes it a loop rather than a dead end.
 */
export function nextScrollLeft(
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  step: number,
): number {
  // A few pixels of slack: sub-pixel layout means the end rarely lands exactly.
  const atEnd = scrollLeft + clientWidth >= scrollWidth - 4;
  return atEnd ? 0 : scrollLeft + step;
}
