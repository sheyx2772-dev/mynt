import "server-only";

import { after } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
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
};

// One press is a request; eleven presses is the same request eleven times, and
// a waiter who is already walking over does not need to be told again.
const PER_POINT_WINDOW_MS = 90 * 1000;

// A ceiling on one table for one hour, so a bored group cannot fill the
// counter's screen. Deliberately not a per-address limit: every guest in the
// room is behind the same Wi-Fi we printed the password for, so an IP here is a
// whole cafe, not a person.
const PER_POINT_PER_HOUR = 12;

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
async function target(normalized: string): Promise<{
  venueId: string;
  venueName: string;
  ownerUserId: string | null;
  planExpiresAt: string;
} | null> {
  if (!supabaseAdmin) return null;

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id, user_id, status")
    .eq("normalized", normalized)
    .maybeSingle();

  if (!handle || handle.status !== "claimed") return null;

  const { data: venue } = await supabaseAdmin
    .from("venues")
    .select("id, name, plan_expires_at")
    .eq("handle_id", handle.id as string)
    .maybeSingle();

  if (!venue) return null;

  return {
    venueId: venue.id as string,
    venueName: venue.name as string,
    ownerUserId: (handle.user_id as string) ?? null,
    planExpiresAt: venue.plan_expires_at as string,
  };
}

export async function sendVenueRequest(opts: {
  handle: string;
  point: string | null;
  kind: RequestKind;
  rating?: number | null;
  note?: string | null;
}): Promise<SendResult> {
  if (!supabaseAdmin) return { ok: false, error: "failed" };

  const found = await target(opts.handle);
  if (!found) return { ok: false, error: "failed" };

  // Checked here and not only by hiding the button: a page left open when the
  // month ran out would otherwise keep writing rows nobody is allowed to read,
  // and a form can be posted by anyone in any case.
  if (new Date(found.planExpiresAt).getTime() <= Date.now()) {
    return { ok: false, error: "expired" };
  }

  const point = opts.point?.trim().slice(0, 12) || null;
  const ip = await getClientIp();

  // A review is a considered thing somebody types once; the two one-tap kinds
  // are what a bored table presses repeatedly. Pressing "waiter" again while
  // the first one is still unanswered is the same request, not a second one.
  // Both limits are per point, never per venue: table 3 asking for the bill
  // must not be refused because table 7 is still waiting for a waiter.
  const atThisPoint = () => {
    const query = supabaseAdmin!
      .from("venue_requests")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", found.venueId);

    return point ? query.eq("point", point) : query.is("point", null);
  };

  if (opts.kind !== "review") {
    const since = new Date(Date.now() - PER_POINT_WINDOW_MS).toISOString();
    const { count } = await atThisPoint()
      .eq("kind", opts.kind)
      .eq("status", "new")
      .gte("created_at", since);

    if ((count ?? 0) > 0) return { ok: false, error: "tooSoon" };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recent } = await atThisPoint().gte("created_at", hourAgo);
  if ((recent ?? 0) >= PER_POINT_PER_HOUR) return { ok: false, error: "tooSoon" };

  const rating =
    opts.kind === "review" && opts.rating && opts.rating >= 1 && opts.rating <= 5
      ? opts.rating
      : null;

  const { error } = await supabaseAdmin.from("venue_requests").insert({
    venue_id: found.venueId,
    point,
    kind: opts.kind,
    rating,
    note: opts.note?.trim().slice(0, 500) || null,
    ip,
  });

  if (error) return { ok: false, error: "failed" };

  // A request is worth something for about as long as the guest is still
  // sitting there, so it goes out now rather than the next time somebody opens
  // the cabinet — through after(), so the guest gets their confirmation without
  // waiting on Telegram.
  if (found.ownerUserId) {
    // Written out here rather than imported from the vocabulary, which imports
    // this file for its types — one message in one language is a smaller cost
    // than a cycle between the two modules.
    const WHAT: Record<RequestKind, string> = {
      waiter: "chaqirdi",
      bill: "hisob so'radi",
      clean: "tozalash so'radi",
      review: "izoh qoldirdi",
      other: "so'rov yubordi",
    };
    const what = WHAT[opts.kind];

    const who = point ?? found.venueName;
    const ownerUserId = found.ownerUserId;

    after(
      notify({
        userId: ownerUserId,
        kind: "venue_request",
        handle: opts.handle,
        title: `${who} — ${what}`,
        body: opts.note?.slice(0, 200) ?? null,
        href: `/kabinet/${opts.handle}/sorovlar`,
      }),
    );
  }

  return { ok: true };
}

/**
 * What the counter sees, in the order it should be dealt with.
 *
 * Waiting requests come oldest first, which is the opposite of a feed and the
 * right way round for this: the table that has been waiting six minutes is the
 * one somebody needs to walk to, not the one that just pressed. Everything
 * already answered is history, so that half is newest first.
 *
 * Ownership is checked by the caller.
 */
export async function listVenueRequests(
  venueId: string,
  limit = 100,
): Promise<VenueRequest[]> {
  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("venue_requests")
    .select("id, point, kind, rating, note, status, created_at")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    point: (row.point as string) ?? null,
    kind: row.kind as RequestKind,
    rating: (row.rating as number) ?? null,
    note: (row.note as string) ?? null,
    status: row.status as "new" | "done",
    createdAt: row.created_at as string,
  }));

  const waiting = rows.filter((r) => r.status === "new").reverse();
  const answered = rows.filter((r) => r.status !== "new");
  return [...waiting, ...answered];
}

export async function markRequestDone(venueId: string, id: string): Promise<void> {
  if (!supabaseAdmin) return;

  await supabaseAdmin
    .from("venue_requests")
    .update({ status: "done" })
    .eq("id", id)
    .eq("venue_id", venueId);
}

/** How many tables are still waiting. Shown as a badge on the cabinet. */
export async function countWaiting(venueId: string): Promise<number> {
  if (!supabaseAdmin) return 0;

  const { count } = await supabaseAdmin
    .from("venue_requests")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId)
    .eq("status", "new");

  return count ?? 0;
}

/**
 * The rows behind the report.
 *
 * A window rather than everything: a venue that has been open two years should
 * not pay for two years of rows to answer a question about this month. The cap
 * is generous — a busy cafe on twelve tables writes a few hundred a week — and
 * the page says when it has been hit rather than quietly reporting a slice as
 * if it were the whole month.
 */
export async function listRequestsSince(
  venueId: string,
  days: number,
  limit = 4000,
): Promise<{ rows: ReportRow[]; capped: boolean }> {
  if (!supabaseAdmin) return { rows: [], capped: false };

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabaseAdmin
    .from("venue_requests")
    .select("point, kind, rating, status, created_at, done_at")
    .eq("venue_id", venueId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows: ReportRow[] = (data ?? []).map((row) => ({
    point: (row.point as string) ?? null,
    kind: row.kind as RequestKind,
    rating: (row.rating as number) ?? null,
    status: row.status as "new" | "done",
    createdAt: row.created_at as string,
    doneAt: (row.done_at as string) ?? null,
  }));

  return { rows, capped: rows.length >= limit };
}
