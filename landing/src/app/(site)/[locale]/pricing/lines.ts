/**
 * A list of strings out of the message catalogue, or nothing.
 *
 * `t.raw` answers a missing message with the key path rather than by throwing,
 * so a translator who drops one array leaves a string where a list was — and
 * the `.map` under it takes the whole page down, in one language only, which
 * is the kind of break that ships. An empty list loses a paragraph.
 */
export function lines(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((v) => typeof v === "string") : [];
}
