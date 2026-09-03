import "server-only";

import { cache } from "react";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";

// What the bottom bar should offer this particular person.
//
// The four tabs were the same for everybody, which meant a cafe owner carried a
// posts feed they open approximately never and reached the one screen they open
// forty times a day through three taps of the cabinet. A bar that does not know
// who is holding it is a bar that is wrong for whoever is paying most.
//
// Memoized for the render pass, and it costs a signed-out visitor nothing: the
// user lookup is already memoized by getUser and returns null without asking
// the database anything else.

export type VenueTab = { handle: string; waiting: number };

export const venueTab = cache(async (): Promise<VenueTab | null> => {
  if (!supabaseAdmin) return null;

  const user = await getUser();
  if (!user) return null;

  // One statement rather than "find the handles, then find the venue": the
  // inner join is the question being asked — a venue whose handle belongs to
  // this account.
  const { data: venue } = await supabaseAdmin
    .from("venues")
    .select("id, handles!inner(normalized, user_id)")
    .eq("handles.user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!venue) return null;

  const handle = (venue.handles as unknown as { normalized: string }).normalized;

  const { count } = await supabaseAdmin
    .from("venue_requests")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venue.id as string)
    .eq("status", "new");

  return { handle, waiting: count ?? 0 };
});
