import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

// A company holding numbers for its staff.
//
// Three decisions sit under this, all taken from how the market already works,
// and all of them have to be visible to the buyer rather than buried:
//
//   The company pays, on one account, by the seat.
//   A seat is bought, not a person — a leaver frees one rather than burning it.
//   The number stays with the company when its holder leaves.
//
// The last is the one that has to be said out loud at the point of sale and to
// the employee carrying the card. A number that is not yours should never be a
// surprise.

export type Team = {
  id: string;
  name: string;
  seats: number;
  planExpiresAt: string | null;
};

export type TeamHandle = {
  normalized: string;
  holderName: string | null;
  position: string | null;
  /** Null while the number is back in the company's pool. */
  userId: string | null;
  viewCount: number;
};

export async function getTeamForUser(userId: string): Promise<Team | null> {
  if (!supabaseAdmin) return null;

  // Owner first, then any company they administer. Most people have one.
  const { data: owned } = await supabaseAdmin
    .from("teams")
    .select("id, name, seats, plan_expires_at")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (owned) {
    return {
      id: owned.id as string,
      name: owned.name as string,
      seats: owned.seats as number,
      planExpiresAt: (owned.plan_expires_at as string) ?? null,
    };
  }

  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("teams (id, name, seats, plan_expires_at)")
    .eq("user_id", userId)
    .maybeSingle();

  const team = membership?.teams as
    | { id: string; name: string; seats: number; plan_expires_at: string | null }
    | undefined;

  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    seats: team.seats,
    planExpiresAt: team.plan_expires_at ?? null,
  };
}

export async function listTeamHandles(teamId: string): Promise<TeamHandle[]> {
  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("handles")
    .select("normalized, owner_name, position, user_id, view_count")
    .eq("team_id", teamId)
    .order("normalized");

  return (data ?? []).map((row) => ({
    normalized: row.normalized as string,
    holderName: (row.owner_name as string) ?? null,
    position: (row.position as string) ?? null,
    userId: (row.user_id as string) ?? null,
    viewCount: (row.view_count as number) ?? 0,
  }));
}

/**
 * Offboarding. Returns false when the caller has no part in the company that
 * owns the handle, which is the same answer as the handle not existing.
 *
 * The wipe is one statement inside the database rather than a sequence here: a
 * half-finished offboarding — name cleared, phone still showing — is worse than
 * either state, and this is the operation most likely to be interrupted by
 * somebody closing a laptop.
 */
export async function releaseTeamHandle(
  normalized: string,
  actingUserId: string,
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data, error } = await supabaseAdmin.rpc("release_team_handle", {
    target_handle: normalized,
    acting_user: actingUserId,
  });

  return !error && data === true;
}
