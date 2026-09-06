// Where this site answers, and how one profile's address is built.
//
// A profile is `arend.uz/NAV001` — printed on plastic, written onto a chip,
// encoded into a QR code. All three have to be the same string, so it is
// built here once. The old site built the printed address and the encoded one
// separately and they already disagreed in development.

// `||` rather than `??`, and the difference has cost a build before: `??`
// only catches null and undefined, and a Docker build arg for a variable
// nobody set arrives as an empty string. That gives an empty origin, which
// reaches `new URL()` and fails — in CI only, because a developer's machine
// leaves the variable unset rather than empty.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://arend.uz"
).replace(/\/$/, "");

/** The bare host, for the places that show the address rather than link it. */
export const SITE_HOST = new URL(SITE_URL).host;

/**
 * A profile's address.
 *
 * No language in it, and that is deliberate: `proxy.ts` lets a bare number
 * through the locale middleware untouched, because a card engraved with
 * `arend.uz/NAV001` cannot be re-printed when the site learns a fourth
 * language. `/uz/NAV001` is not an address anything points at.
 */
export function profileUrl(handle: string): string {
  return `${SITE_URL}/${handle}`;
}
