import "server-only";

import { userFromBearer, unauthorized, type BearerUser } from "@/lib/auth/bearer";
import { getOwnedHandle, type OwnedHandle } from "@/lib/handles";
import { parseHandle } from "@/lib/pricing";

// The door every mobile route goes through.
//
// `@/lib/kabinet` is the same idea for the website, and the reason both exist
// is the same: there is one check, and a screen — or a route — that does not
// call it has no handle to work with. Two doors rather than one only because
// they open on different keys, a cookie there and a bearer token here.
//
// The handle arrives in a query string, which is to say from the client, which
// is to say it means nothing until it has been read back out of the database
// under the caller's own id. A number somebody else owns comes back null and
// the answer is a 404 — the same answer an invented number gets, so a guesser
// learns nothing either way.

export type OwnerContext = { user: BearerUser; normalized: string; owned: OwnedHandle };

export type OwnerCheck =
  | { ok: true; context: OwnerContext }
  | { ok: false; response: Response };

export async function requireOwner(request: Request, raw: string | null): Promise<OwnerCheck> {
  const user = await userFromBearer(request);
  if (!user) return { ok: false, response: unauthorized() };

  const parsed = raw ? parseHandle(raw) : null;
  if (!parsed) {
    return { ok: false, response: Response.json({ error: "Raqam noto'g'ri." }, { status: 400 }) };
  }

  const normalized = `${parsed.letters}${parsed.digits}`;
  const owned = await getOwnedHandle(normalized);
  if (!owned) {
    return { ok: false, response: Response.json({ error: "Topilmadi." }, { status: 404 }) };
  }

  return { ok: true, context: { user, normalized, owned } };
}
