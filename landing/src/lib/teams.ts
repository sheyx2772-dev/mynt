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

/**
 * What the company is getting for the money.
 *
 * Views and collected contacts across every number on the account. A firm
 * renewing twenty seats asks exactly one question — did anybody use these — and
 * a per-profile figure buried in twenty cabinets does not answer it.
 */
export type TeamStats = { views: number; leads: number; assigned: number };

export async function getTeamStats(teamId: string): Promise<TeamStats> {
  if (!supabaseAdmin) return { views: 0, leads: 0, assigned: 0 };

  const { data: rows } = await supabaseAdmin
    .from("handles")
    .select("id, view_count, user_id")
    .eq("team_id", teamId);

  const handles = rows ?? [];
  const ids = handles.map((r) => r.id as string);

  const { count } = ids.length
    ? await supabaseAdmin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("handle_id", ids)
    : { count: 0 };

  return {
    views: handles.reduce((sum, r) => sum + ((r.view_count as number) ?? 0), 0),
    leads: count ?? 0,
    assigned: handles.filter((r) => r.user_id).length,
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

/**
 * Giving one of the company's numbers to a member of staff.
 *
 * The person needs an account, because a handle belongs to a user id. If they
 * have none, Supabase invites them and the number is waiting when they follow
 * the link — asking an admin to chase twenty people to register first, and only
 * then assign, is the kind of two-step nobody completes.
 */
export type AssignResult =
  | { ok: true; invited: boolean }
  | { ok: false; error: string };

export async function assignTeamHandle(
  normalized: string,
  email: string,
  actingUserId: string,
): Promise<AssignResult> {
  if (!supabaseAdmin) return { ok: false, error: "Hozir bo'lmadi." };

  const team = await getTeamForUser(actingUserId);
  if (!team) return { ok: false, error: "Sizda firma hisobi yo'q." };

  // The handle must be this company's and nobody's. Reassigning an occupied
  // number silently would take somebody's profile away without the wipe that
  // offboarding does deliberately.
  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("normalized, user_id")
    .eq("normalized", normalized)
    .eq("team_id", team.id)
    .maybeSingle();

  if (!handle) return { ok: false, error: "Bu raqam firmangizga tegishli emas." };
  if (handle.user_id) {
    return { ok: false, error: "Raqam band. Avval uni bo'shating." };
  }

  const { count } = await supabaseAdmin
    .from("handles")
    .select("normalized", { count: "exact", head: true })
    .eq("team_id", team.id)
    .not("user_id", "is", null);

  if ((count ?? 0) >= team.seats) {
    return { ok: false, error: `Bo'sh o'rin yo'q — ${team.seats} tadan hammasi band.` };
  }

  const found = await findOrInviteUser(email);
  if ("error" in found) return { ok: false, error: found.error };

  const { error } = await supabaseAdmin
    .from("handles")
    .update({ user_id: found.id, claimed_at: new Date().toISOString(), status: "claimed" })
    .eq("normalized", normalized)
    .eq("team_id", team.id)
    .is("user_id", null);

  if (error) return { ok: false, error: "Biriktirilmadi." };
  return { ok: true, invited: found.invited };
}

/**
 * Supabase exposes no lookup by email on the JS admin client, so the auth admin
 * API is called directly. An invite that comes back as "already registered" is
 * the normal case for a second number, not an error.
 */
async function findOrInviteUser(
  email: string,
): Promise<{ id: string; invited: boolean } | { error: string }> {
  if (!supabaseAdmin) return { error: "Hozir bo'lmadi." };

  const existing = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  const match = existing.data?.users.find(
    (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
  );
  if (match) return { id: match.id, invited: false };

  const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
  if (invited.error || !invited.data.user) {
    // Worth reporting rather than flattening to "it did not work". The common
    // cause is an address at a domain with no mail set up, which the admin can
    // do something about; a generic failure sends them to us instead.
    if (invited.error?.code === "email_address_invalid") {
      return { error: `${email} — bu manzilga xat yuborib bo'lmadi. Manzilni tekshiring.` };
    }
    return { error: "Taklif yuborilmadi. Keyinroq urinib ko'ring." };
  }

  return { id: invited.data.user.id, invited: true };
}
