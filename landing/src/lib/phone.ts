// A phone number, as it is typed and as it is read back.
//
// Nothing here decides whether a number is real — the backend does that, and
// it is the only place that can: it knows the dial codes, the national
// lengths, and which of them we can actually send an SMS to. Repeating that
// table in the browser would give the site a second opinion about a number,
// and the two would drift the first time an operator range changed.
//
// So this file does the two things the browser is genuinely better at:
// grouping the digits while somebody types them, and refusing something that
// could not be a phone number under any plan before it costs a round trip.

/**
 * Every digit and nothing else, cut at the longest number this product can
 * ever send an SMS to.
 *
 * Twelve, not E.164's fifteen: the code goes out through an Uzbek provider to
 * an Uzbek number, which is `998` and nine more. Fifteen was the standards
 * answer to a question nobody asked here, and it let the field take
 * `998950222312222` and look willing to send something to it.
 */
export const MAX_PHONE_DIGITS = 12;

export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);
}

/**
 * The shortest thing that could still be a number: a bare Uzbek national one,
 * nine digits with the dial code left off.
 */
export const MIN_PHONE_DIGITS = 9;

/** `998901234567` reads back as `+998 90 123 45 67`. */
export function formatPhone(digits: string): string {
  const clean = phoneDigits(digits);
  if (!clean) return "";

  // Grouped the way it is written on every shopfront here. Thirteen digits in
  // a row have to be read one at a time; four short groups can be checked at a
  // glance, which is the whole point of showing the number back to somebody
  // about to wait for an SMS on it.
  const rest = clean.slice(3);
  // Anything longer than an Uzbek national number is a typo in progress, and
  // grouping it would hide the digits that make it one — so it is shown whole.
  if (!clean.startsWith("998") || rest.length > 9) return `+${clean}`;

  const parts = [
    rest.slice(0, 2),
    rest.slice(2, 5),
    rest.slice(5, 7),
    rest.slice(7, 9),
  ].filter(Boolean);

  return `+998 ${parts.join(" ")}`.trimEnd();
}
