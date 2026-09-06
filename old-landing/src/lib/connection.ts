// Whether the counter phone is still hearing the room.
//
// The screen by the till refreshes itself every ten seconds, and when the cafe's
// internet goes the refresh simply does not happen: no error, no change, the
// last list still on screen and the header still saying "bo'sh". A waiter reads
// that as a quiet minute. It is the worst way for this to fail, because the
// product's whole claim is that the screen tells you when a table is waiting.
//
// So the phone decides for itself whether it is connected, and it decides from
// whether the server answered — not from navigator.onLine, which reports the
// network interface. The usual outage in a cafe is exactly the one that lies
// about: the router is up, the phone is happily on the Wi-Fi, and nothing gets
// out to the internet.

export type Link = "live" | "slow" | "lost";

/**
 * One missed poll is a blip and two is an outage.
 *
 * Shouting on the first failure would put a red bar on the screen several times
 * an hour on a normal Tashkent connection, and a warning that cries wolf is a
 * warning people learn to look past — which leaves the screen lying again, just
 * more colourfully.
 */
export const LOST_AFTER_FAILURES = 2;

export function linkState(consecutiveFailures: number): Link {
  if (consecutiveFailures <= 0) return "live";
  if (consecutiveFailures < LOST_AFTER_FAILURES) return "slow";
  return "lost";
}

/**
 * How long the screen has been blind, in words a waiter can act on.
 *
 * Seconds for the first minute, because at that scale "1 daqiqa" reads as
 * longer than it is and somebody may be about to restart a router over it.
 */
export function blindFor(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} soniya`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} daqiqa`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} soat` : `${hours} soat ${rest} daqiqa`;
}

/**
 * What the bar says.
 *
 * `lost` names the consequence rather than the cause. "Internet yo'q" alone
 * invites somebody to shrug at it; the sentence that gets a phone picked up is
 * the one saying new calls are not arriving.
 */
export function linkWords(state: Link, sinceMs: number): string | null {
  if (state === "live") return null;
  if (state === "slow") return "Aloqa uzilib turdi — qayta ulanyapti…";
  return `Internet yo'q — ${blindFor(sinceMs)}dan beri yangi chaqiruvlar ko'rinmayapti`;
}

/**
 * Whether the count in the header can be believed.
 *
 * While the screen is blind "bo'sh" is not a fact about the room, it is a fact
 * about a stale list, and the header must stop asserting it.
 */
export function countIsTrustworthy(state: Link): boolean {
  return state !== "lost";
}
