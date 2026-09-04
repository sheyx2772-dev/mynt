import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

// Recommendations: one tap, no form, no score.
//
// Chosen over a rating because a rating on a visiting card cannot be made
// honest. Uncontrolled, one bad actor marks somebody for years; controlled, an
// average the owner can switch off proves nothing but that the owner liked it.
// A recommendation is positive by construction, so there is nothing to poison
// and nothing to hide, and the count is the whole claim.

export type Recommender = { handle: string; name: string };

export async function isRecommended(normalized: string, userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data } = await supabaseAdmin
    .from("handles")
    .select("id, recommendations!inner(user_id)")
    .eq("normalized", normalized)
    .eq("recommendations.user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

/**
 * Who vouched, by their own handle.
 *
 * Only people who hold a handle are listed. A name on its own is a claim;
 * a handle is a profile somebody can open and judge for themselves, which is
 * the entire value of a recommendation over a number.
 */
export async function listRecommenders(normalized: string, limit = 12): Promise<Recommender[]> {
  if (!supabaseAdmin) return [];

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id")
    .eq("normalized", normalized)
    .maybeSingle();

  if (!handle) return [];

  const { data: rows } = await supabaseAdmin
    .from("recommendations")
    .select("user_id")
    .eq("handle_id", handle.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows || rows.length === 0) return [];

  const { data: authors } = await supabaseAdmin
    .from("handles")
    .select("normalized, owner_name")
    .in("user_id", rows.map((r) => r.user_id as string))
    .eq("status", "claimed")
    .limit(limit);

  return (authors ?? []).map((a) => ({
    handle: a.normalized as string,
    name: (a.owner_name as string) ?? (a.normalized as string),
  }));
}

export type ToggleResult =
  | { ok: true; recommended: boolean }
  | { ok: false; error: string };

/** Recommending, and taking it back. The same tap either way. */
export async function toggleRecommendation(
  normalized: string,
  userId: string,
): Promise<ToggleResult> {
  if (!supabaseAdmin) return { ok: false, error: "Hozir bo'lmadi." };

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id, user_id")
    .eq("normalized", normalized)
    .eq("status", "claimed")
    .maybeSingle();

  if (!handle) return { ok: false, error: "Bu profil topilmadi." };
  if (handle.user_id === userId) {
    return { ok: false, error: "O'zingizni tavsiya qilib bo'lmaydi." };
  }

  const { data: existing } = await supabaseAdmin
    .from("recommendations")
    .select("user_id")
    .eq("handle_id", handle.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("recommendations")
      .delete()
      .eq("handle_id", handle.id)
      .eq("user_id", userId);
    return { ok: true, recommended: false };
  }

  const { error } = await supabaseAdmin
    .from("recommendations")
    .insert({ handle_id: handle.id, user_id: userId });

  // A race between two taps lands here as a duplicate, which means it is on.
  if (error && error.code !== "23505") return { ok: false, error: "Bo'lmadi." };
  return { ok: true, recommended: true };
}
