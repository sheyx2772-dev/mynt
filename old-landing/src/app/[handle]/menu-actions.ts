"use server";

import { parseHandle } from "@/lib/pricing";
import { sendVenueRequest, isRequestKind, type SendResult } from "@/lib/venue-requests";

// What a guest at a table can trigger.
//
// Everything arriving here was typed or tapped by a stranger with no account,
// which is the point — asking for the bill cannot require signing in. So the
// handle is re-parsed rather than trusted, the venue and its owner are resolved
// server-side, and the rate limiting lives in the same place as the insert.

export async function requestFromTable(input: {
  handle: string;
  point: string | null;
  kind: string;
  rating?: number;
  note?: string;
}): Promise<SendResult> {
  const parsed = parseHandle(input.handle);
  if (!parsed) return { ok: false, error: "failed" };
  if (!isRequestKind(input.kind)) return { ok: false, error: "failed" };

  return sendVenueRequest({
    handle: `${parsed.letters}${parsed.digits}`,
    point: input.point,
    kind: input.kind,
    rating: input.rating ?? null,
    note: input.note ?? null,
  });
}
