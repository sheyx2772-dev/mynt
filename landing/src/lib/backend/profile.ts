import "server-only";

import { backend } from "./client";

export type PublicProfile = {
  raqam: string;
  ism: string;
  lavozim?: string;
  kompaniya?: string;
  rasm?: string;
};

/**
 * Who holds this number, or null if nobody does.
 *
 * 404 is an answer, not a failure: it is what "free" looks like. Anything else
 * — the backend down, a timeout — is not an answer, and returning null for it
 * would tell a visitor a number is free when we do not know. So it throws, and
 * the caller says so.
 */
export async function ownerOf(handle: string): Promise<PublicProfile | null> {
  const { data, error, response } = await backend.GET("/profil/{raqam}", {
    params: { path: { raqam: handle } },
    // A number's owner changes at most once. Held briefly so a visitor trying
    // six numbers does not make six round trips to Frankfurt, and briefly
    // enough that a number bought a minute ago stops looking free.
    next: { revalidate: 60 },
  });

  if (response.status === 404) return null;
  if (error || !data?.profil) throw new Error(`profil: ${response.status}`);

  const p = data.profil;
  return {
    raqam: p.raqam,
    ism: p.ism ?? "",
    lavozim: p.lavozim || undefined,
    kompaniya: p.kompaniya || undefined,
    rasm: p.rasm || undefined,
  };
}
