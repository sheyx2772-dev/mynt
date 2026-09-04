import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export { MAX_POST_LENGTH } from "@/lib/post-limits";

export type Post = {
  id: string;
  handle: string;
  body: string;
  createdAt: string;
  author: { name: string; avatarUrl: string | null } | null;
};

type PostRow = { id: string; handle: string; body: string; created_at: string };

// Posts store the handle, not the author's name, so the display details are
// fetched once for the whole page rather than joined per row.
async function attachAuthors(rows: PostRow[]): Promise<Post[]> {
  if (rows.length === 0) return [];

  const supabase = await createServerSupabase();
  const handles = [...new Set(rows.map((r) => r.handle))];

  const { data: authors } = supabase
    ? await supabase
        .from("handles")
        .select("normalized, owner_name, avatar_url")
        .in("normalized", handles)
    : { data: null };

  const byHandle = new Map(
    (authors ?? []).map((a) => [
      a.normalized,
      { name: a.owner_name ?? a.normalized, avatarUrl: a.avatar_url },
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    handle: row.handle,
    body: row.body,
    createdAt: row.created_at,
    author: byHandle.get(row.handle) ?? null,
  }));
}

export async function listPostsForHandle(handle: string, limit = 50): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("posts")
    .select("id, handle, body, created_at")
    .eq("handle", handle)
    .order("created_at", { ascending: false })
    .limit(limit);

  return attachAuthors(data ?? []);
}

// The feed: posts from the handles this user follows, newest first. Reading
// the follow list needs the admin client because `follows` is readable only
// by its owner, and this runs after the caller has been identified.
export async function listFeed(userId: string, limit = 50): Promise<Post[]> {
  if (!supabaseAdmin) return [];

  const { data: follows } = await supabaseAdmin
    .from("follows")
    .select("followed_handle")
    .eq("follower_user_id", userId);

  const handles = (follows ?? []).map((f) => f.followed_handle);
  if (handles.length === 0) return [];

  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("posts")
    .select("id, handle, body, created_at")
    .in("handle", handles)
    .order("created_at", { ascending: false })
    .limit(limit);

  return attachAuthors(data ?? []);
}
