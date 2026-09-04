import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

// Comments on a profile.
//
// The owner decides whether there are any: closed until they open it, and they
// can remove any of them afterwards. A public comment under a professional's
// name, left by somebody who might be a competitor, is a review they did not
// ask for — and a feature nobody would switch on is worth nothing, so the
// control is the feature rather than a limitation of it.
//
// Authors are signed in, always. An anonymous comment on somebody's card is the
// version of this that gets abused.

export type ProfileComment = {
  id: number;
  authorId: string;
  authorHandle: string | null;
  authorName: string;
  body: string;
  createdAt: string;
};

export async function listComments(normalized: string): Promise<ProfileComment[]> {
  if (!supabaseAdmin) return [];

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id, comments_open")
    .eq("normalized", normalized)
    .maybeSingle();

  // Closed means closed: not hidden in the page, not fetched at all.
  if (!handle || !handle.comments_open) return [];

  const { data } = await supabaseAdmin
    .from("profile_comments")
    .select("id, author_id, body, created_at")
    .eq("handle_id", handle.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  // Who wrote them, by their own handle where they have one. A commenter with
  // a profile of their own is worth more than a name: it is checkable.
  const { data: authors } = await supabaseAdmin
    .from("handles")
    .select("user_id, normalized, owner_name")
    .in("user_id", rows.map((r) => r.author_id as string))
    .eq("status", "claimed");

  const byUser = new Map(
    (authors ?? []).map((a) => [
      a.user_id as string,
      { handle: a.normalized as string, name: (a.owner_name as string) ?? null },
    ]),
  );

  return rows.map((row) => {
    const author = byUser.get(row.author_id as string);
    return {
      id: row.id as number,
      authorId: row.author_id as string,
      authorHandle: author?.handle ?? null,
      authorName: author?.name ?? "Flex",
      body: row.body as string,
      createdAt: row.created_at as string,
    };
  });
}

export type CommentResult = { ok: boolean; error?: string };

export async function addComment(
  normalized: string,
  authorId: string,
  body: string,
): Promise<CommentResult> {
  if (!supabaseAdmin) return { ok: false, error: "Hozir bo'lmadi." };

  const text = body.trim().slice(0, 500);
  if (!text) return { ok: false, error: "Izoh bo'sh." };

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id, user_id, comments_open")
    .eq("normalized", normalized)
    .eq("status", "claimed")
    .maybeSingle();

  if (!handle) return { ok: false, error: "Bu profil topilmadi." };
  if (!handle.comments_open) return { ok: false, error: "Bu profilda izohlar yopiq." };
  if (handle.user_id === authorId) {
    return { ok: false, error: "O'z profilingizga izoh yozib bo'lmaydi." };
  }

  const { error } = await supabaseAdmin
    .from("profile_comments")
    .insert({ handle_id: handle.id, author_id: authorId, body: text });

  if (error) {
    // The one-per-person rule surfaces here as a duplicate key.
    if (error.code === "23505") {
      return { ok: false, error: "Siz bu profilga allaqachon izoh yozgansiz." };
    }
    return { ok: false, error: "Yuborilmadi." };
  }

  return { ok: true };
}

/** Either the author or the profile's owner may remove one. */
export async function deleteComment(id: number, userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data } = await supabaseAdmin
    .from("profile_comments")
    .select("id, author_id, handles!inner(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return false;

  const ownerId = (data.handles as unknown as { user_id: string } | null)?.user_id;
  if (data.author_id !== userId && ownerId !== userId) return false;

  const { error } = await supabaseAdmin.from("profile_comments").delete().eq("id", id);
  return !error;
}
