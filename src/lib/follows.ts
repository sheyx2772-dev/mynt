import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

// Whether this account follows this handle. The follows table is readable
// only by its owner, so this goes through the admin client with the user id
// the caller has already been authenticated as.
export async function isFollowing(userId: string, handle: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data } = await supabaseAdmin
    .from("follows")
    .select("followed_handle")
    .eq("follower_user_id", userId)
    .eq("followed_handle", handle)
    .maybeSingle();

  return Boolean(data);
}

// How many handles this account follows. Shown on a profile as the owner's
// "following" number.
export async function countFollowing(userId: string): Promise<number> {
  if (!supabaseAdmin) return 0;

  const { count } = await supabaseAdmin
    .from("follows")
    .select("followed_handle", { count: "exact", head: true })
    .eq("follower_user_id", userId);

  return count ?? 0;
}
