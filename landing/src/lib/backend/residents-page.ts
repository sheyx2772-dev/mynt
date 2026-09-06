import "server-only";

import { backend } from "./client";
import type { Resident } from "./residents";

/** A directory row, with the two fields the entry page's strip has no room for. */
export type PageResident = Resident & {
  korishlar: number;
  teglar: string[];
};

export type Catalogue = {
  /** Numbers issued so far. */
  band: number;
  /** Every number the AAA000 format can hold. */
  jami: number;
  residents: PageResident[];
};

// A page's worth, where `directory()` next door asks for eight.
//
// The two are one endpoint and deliberately not one call: `soni` is part of
// the URL, so a different count is a different entry in Next's fetch cache.
// Sharing would mean either a strip that fetches sixty rows to show eight, or
// a directory page eight names long — and this page's whole claim is that it
// lists everybody.
const PAGE_SIZE = 60;

/**
 * Everyone holding a number, newest first — or null if the backend did not answer.
 *
 * Null rather than an empty list, and the distinction is the point of the
 * page. An empty grid reads as "nobody has bought one", which is a lie about
 * the product told on the strength of a timeout, in front of the visitor who
 * came here to check exactly that. The caller renders the two differently.
 */
export async function catalogue(): Promise<Catalogue | null> {
  try {
    const { data, error } = await backend.GET("/rezidentlar", {
      params: { query: { yangi: true, soni: PAGE_SIZE } },
      // Somebody buys a number a few times a day, not a few times a second.
      // Five minutes is short enough that "newest" is honestly newest, and
      // long enough that a burst of visitors is one query rather than a
      // thousand.
      next: { revalidate: 300 },
    });

    if (error || !data) return null;

    return {
      band: data.egallangan,
      jami: data.jami,
      // Both lists come back as null when empty. A caller that has to remember
      // which of its fields lie about emptiness is one that will forget.
      residents: (data.rezidentlar ?? []).map((r) => ({
        raqam: r.raqam,
        ism: r.ism,
        rasm: r.rasm || undefined,
        shahar: r.shahar || undefined,
        korishlar: r.korishlar,
        teglar: r.teglar ?? [],
      })),
    };
  } catch {
    // A refused connection or a timeout throws out of `fetch` rather than
    // coming back as an error status. Same answer: we do not know.
    return null;
  }
}
