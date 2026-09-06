import "server-only";

import { backend } from "./client";

export type Resident = {
  raqam: string;
  ism: string;
  rasm?: string;
  shahar?: string;
};

export type Directory = {
  /** Numbers issued so far. */
  band: number;
  /** Every number the AAA000 format can hold. The backend knows it, because
   *  it is a property of the format rather than a fact about the table. */
  jami: number;
  newest: Resident[];
};

// Both live sections on the entry page read this one call, and both ask for
// the same `soni` on purpose: one URL is one entry in Next's fetch cache, so
// the counter and the residents strip cost one round trip between them instead
// of two. Change this and they quietly become two.
const NEWEST = 8;

/**
 * The public directory: how many numbers are gone, how many are left, and who
 * took the last few.
 *
 * Returns null instead of throwing, which is the opposite of `ownerOf` next
 * door, and the difference is worth stating. "Nobody holds AAA777" is a claim
 * about one number that a visitor is about to act on, so getting it wrong by
 * guessing is expensive and `ownerOf` throws rather than guess. These two
 * sections are ornaments on the entry page — the page sells the same thing
 * without them. So an unreachable backend renders nothing at all, and no
 * number on this page is ever one we made up to fill the space.
 */
export async function directory(): Promise<Directory | null> {
  try {
    const { data, error } = await backend.GET("/rezidentlar", {
      params: { query: { yangi: true, soni: NEWEST } },
      // Somebody buys a number a few times a day, not a few times a second.
      // Five minutes is short enough that the count is honestly "now" and long
      // enough that a burst of visitors is one query rather than thousands.
      next: { revalidate: 300 },
    });

    if (error || !data) return null;

    return {
      band: data.egallangan,
      jami: data.jami,
      // `rezidentlar` is null when empty. A caller that has to remember which
      // of its fields lie about emptiness is a caller that will forget.
      newest: (data.rezidentlar ?? []).map((r) => ({
        raqam: r.raqam,
        ism: r.ism,
        rasm: r.rasm || undefined,
        shahar: r.shahar || undefined,
      })),
    };
  } catch {
    // A refused connection or a timeout throws out of `fetch`. Same answer as
    // an error status: we do not know, so we say nothing.
    return null;
  }
}
