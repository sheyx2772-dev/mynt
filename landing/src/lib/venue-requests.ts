import "server-only";

import { asReader, backend } from "@/lib/backend/client";

import { after } from "next/server";

import { getClientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";
import type { ReportRow } from "@/lib/venue-report";

// A guest asking for something from the table.
//
// The point is the whole reason the table number is in the URL: "somebody
// wants the bill" is not actionable and "table 7 wants the bill" is. It comes
// from the address, so it is a string a stranger controls — trimmed hard and
// never used for anything but display.

export type RequestKind = "waiter" | "bill" | "review" | "clean" | "other";

export const REQUEST_KINDS: readonly RequestKind[] = [
  "waiter",
  "bill",
  "review",
  "clean",
  "other",
];

export function isRequestKind(value: unknown): value is RequestKind {
  return typeof value === "string" && (REQUEST_KINDS as readonly string[]).includes(value);
}

export type VenueRequest = {
  id: string;
  point: string | null;
  kind: RequestKind;
  rating: number | null;
  note: string | null;
  status: "new" | "done";
  createdAt: string;
  /** When the counter closed it. The report measures the gap. */
  doneAt: string | null;
};

// One press is a request; eleven presses is the same request eleven times, and
// a waiter who is already walking over does not need to be told again.
const PER_POINT_WINDOW_MS = 90 * 1000;

// A ceiling on one table for one hour, so a bored group cannot fill the
// counter's screen. Deliberately not a per-address limit: every guest in the
// room is behind the same Wi-Fi we printed the password for, so an IP here is a
// whole cafe, not a person.
const PER_POINT_PER_HOUR = 12;


/**
 * The venue's own name for a point, matched against what the URL claimed.
 *
 * Compared without case or surrounding space, because the number is printed on
 * a sticker and typed back by hand as often as it is tapped: "Stol 3", "stol 3"
 * and " STOL 3 " are one table. Returns the venue's spelling, so the counter
 * shows what the owner wrote rather than what the guest typed.
 */
export function pointOf(points: string[], asked: string): string | null {
  const want = asked.trim().toLocaleLowerCase();
  return points.find((p) => p.trim().toLocaleLowerCase() === want) ?? null;
}

export type SendResult =
  | { ok: true }
  | { ok: false; error: "tooSoon" | "expired" | "failed" };

/**
 * The venue behind a handle, plus who to wake.
 *
 * The guest sends a handle, because that is what the address on the stand says
 * and it is the only identifier they can possibly have. Everything private —
 * the venue's row id, the owner's account — is resolved here rather than being
 * put in the page for a stranger to post back.
 */
export async function sendVenueRequest(opts: {
  handle: string;
  point: string | null;
  kind: RequestKind;
  rating?: number | null;
  note?: string | null;
}): Promise<SendResult> {
  const { error, response } = await backend.POST("/profil/{raqam}/sorov", {
    params: { path: { raqam: opts.handle } },
    body: {
      // A request with no point still reaches the counter. The case that
      // matters is a rename — the owner changes "Stol 3" to "3-stol" and the
      // sticker already on the table says the old one — and a refusal would
      // leave a real guest unable to call anybody at all.
      nuqta: opts.point ?? "—",
      turi: opts.kind,
      baho: opts.rating ?? undefined,
      izoh: opts.note ?? undefined,
    },
  });

  if (!error) return { ok: true };
  if (response.status === 403) return { ok: false, error: "expired" };
  if (response.status === 429) return { ok: false, error: "tooSoon" };
  return { ok: false, error: "failed" };
}

/** What the counter sees, for the owner. */
export async function listVenueRequests(handle: string): Promise<VenueRequest[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/sorovlar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.sorovlar ?? []).map(toRequest);
}

/** The counter screen, reached by its own link rather than by a session. */
export async function listRequestsByToken(token: string): Promise<VenueRequest[]> {
  const { data, error } = await backend.GET("/xodim/{kalit}", {
    params: { path: { kalit: token } },
  });
  if (error || !data) return [];

  return (data.sorovlar ?? []).map(toRequest);
}

type BackendRequest = {
  id: string;
  nuqta: string;
  turi: string;
  baho?: number;
  izoh?: string;
  holat: string;
  vaqt: string;
  bajarilgan?: string;
};

function toRequest(r: BackendRequest): VenueRequest {
  return {
    id: r.id,
    point: r.nuqta === "—" ? null : r.nuqta,
    kind: r.turi as RequestKind,
    rating: r.baho ?? null,
    note: r.izoh ?? null,
    status: r.holat as "new" | "done",
    createdAt: r.vaqt,
    doneAt: r.bajarilgan ?? null,
  };
}

export async function closeVenueRequest(handle: string, id: string): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.POST("/raqamlar/{raqam}/sorovlar/{id}/bajarildi", {
    params: { path: { raqam: handle, id } },
  });
  return !error;
}

export async function closeRequestByToken(token: string, id: string): Promise<boolean> {
  const { error } = await backend.POST("/xodim/{kalit}/sorovlar/{id}/bajarildi", {
    params: { path: { kalit: token, id } },
  });
  return !error;
}

/** How many tables are waiting, and how many have ever asked. */
export async function countWaiting(handle: string): Promise<number> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/sorovlar", {
    params: { path: { raqam: handle }, query: { soni: 1 } },
  });
  return error || !data ? 0 : data.kutilmoqda;
}

export async function countAllRequests(handle: string): Promise<number> {
  return (await listVenueRequests(handle)).length;
}

/**
 * The month's requests, for the report.
 *
 * Capped rather than paged: a report is read whole, and a cafe that has taken
 * two hundred requests in a month has a report worth reading rather than a
 * scroll worth abandoning.
 */
export async function listRequestsSince(
  handle: string,
  days: number,
): Promise<{ rows: VenueRequest[]; capped: boolean }> {
  const all = await listVenueRequests(handle);
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const rows = all.filter((r) => new Date(r.createdAt).getTime() >= since);
  return { rows, capped: all.length >= 200 };
}

/** Closing one, from the cabinet or from the counter link. */
export async function markRequestDone(handleOrToken: string, id: string): Promise<boolean> {
  // A number is six characters and a token is twenty or more, which is the
  // difference between the two doors.
  return /^[A-Z]{3}[0-9]{3}$/.test(handleOrToken)
    ? closeVenueRequest(handleOrToken, id)
    : closeRequestByToken(handleOrToken, id);
}
