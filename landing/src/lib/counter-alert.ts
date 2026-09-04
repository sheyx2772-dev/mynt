// Deciding when the counter phone should make a noise.
//
// Kept apart from the component because the rule is the whole thing and the
// component is a button and a border: a phone that beeps for the backlog every
// time the page refreshes is a phone somebody turns the sound off on, which is
// worse than no sound at all.

export type AlertDecision = {
  /** Requests that were not on the previous list. */
  fresh: string[];
  /** Whether to make a noise about them. */
  ring: boolean;
};

/**
 * What changed between two renders of the waiting list.
 *
 * `primed` is false for the very first render: opening the screen on a room
 * with four tables already waiting must not sound like four new calls. From
 * then on anything that was not there before is new, however it arrived — a
 * request the till phone closed and a request the owner closed both simply
 * leave the list, and neither can come back as an arrival.
 */
export function decideAlert(
  seen: ReadonlySet<string>,
  waiting: readonly string[],
  primed: boolean,
): AlertDecision {
  const fresh = waiting.filter((id) => !seen.has(id));
  return { fresh, ring: primed && fresh.length > 0 };
}
