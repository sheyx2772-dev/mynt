// Addresses, built from one public value.
//
// Split out of site.ts, which imports next/headers and so cannot be reached
// from a client component. The points editor lists the address that goes onto
// each NFC chip, and it has to be the same string the QR route encodes — the
// first version built the two separately and they already disagreed in
// development.

// Canonical production origin. Everything that builds an absolute link starts
// from here, and it never comes from a request.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://flex.com.uz"
).replace(/\/$/, "");

/**
 * A profile's address, optionally carrying where the visit came from.
 *
 * The devices and the QR code are issued with a source so the owner can see
 * whether the card they paid for is what brings people, rather than seeing a
 * direct visit that could equally be somebody typing the address.
 */
export function profileUrl(handle: string, source?: "nfc" | "qr" | "share"): string {
  return source ? `${SITE_URL}/${handle}?src=${source}` : `${SITE_URL}/${handle}`;
}

/**
 * The address on one tag.
 *
 * A tag stuck to a table has to say which table, or every request it produces
 * arrives from nowhere. The same string is encoded into the QR code, written
 * onto the NFC chip and printed under the code, so all three come from here —
 * the first version of this had the printed address and the encoded one built
 * separately, and in development they already disagreed.
 *
 * The label is a stranger-visible string that ends up in a query, so it is
 * stripped to letters, digits and the few marks a table name uses.
 */
export function pointLabel(raw: string | null | undefined): string | null {
  return raw?.replace(/[^\p{L}\p{N} .\-]/gu, "").trim().slice(0, 12) || null;
}

export function pointUrl(
  handle: string,
  point: string | null,
  source: "nfc" | "qr",
): string {
  const base = profileUrl(handle, source);
  const label = pointLabel(point);
  return label ? `${base}&stol=${encodeURIComponent(label)}` : base;
}
