import "server-only";

import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getOwnedHandle, type OwnedHandle } from "@/lib/handles";
import { parseHandle } from "@/lib/pricing";

// The door every cabinet screen goes through.
//
// The cabinet used to be one enormous page, so this check existed once. It is
// now a hub with a screen behind each tile, and the danger of that shape is a
// screen that forgets the check — so there is one function, and a screen that
// does not call it has no handle to render.
//
// Ownership is a filter on the read: a handle somebody else owns comes back
// null and the screen is a 404, which tells a guesser nothing about whether the
// number exists.
export async function requireOwnHandle(
  raw: string,
  /** Where to return after signing in — this screen. */
  path: string,
): Promise<{ normalized: string; owned: OwnedHandle; userId: string }> {
  const parsed = parseHandle(raw);
  if (!parsed) notFound();

  const normalized = `${parsed.letters}${parsed.digits}`;
  const user = await requireUser(path.replace("[handle]", normalized));
  const owned = await getOwnedHandle(normalized, user.id);
  if (!owned) notFound();

  return { normalized, owned, userId: user.id };
}
