import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildDesignPrompt, screenWish } from "@/lib/ai-design";

// A buyer asks for a card, in their own words, and gets one back.
//
// No generator is called here. Image models have no free tier, so the request
// is queued and filled by hand for now. The row is shaped for the automated
// version so that swapping one in later changes who fills the queue, not what
// the buyer sees or what the database holds.

export type DesignRequest = {
  id: string;
  handle: string;
  wish: string;
  status: "pending" | "filled" | "refused";
  imageUrl: string | null;
  note: string | null;
  createdAt: string;
};

export type RequestResult = { ok: true } | { ok: false; error: string };

function rowToRequest(row: Record<string, unknown>): DesignRequest {
  return {
    id: row.id as string,
    handle: row.handle as string,
    wish: row.wish as string,
    status: row.status as DesignRequest["status"],
    imageUrl: (row.image_url as string) ?? null,
    note: (row.note as string) ?? null,
    createdAt: row.created_at as string,
  };
}

const COLUMNS = "id, handle, wish, status, image_url, note, created_at";

export async function listDesignRequests(handle: string): Promise<DesignRequest[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("design_requests")
    .select(COLUMNS)
    .eq("handle", handle)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map(rowToRequest);
}

export async function requestDesign(
  userId: string,
  handle: string,
  wish: string
): Promise<RequestResult> {
  // Screened before anything is stored, so the buyer is told why immediately
  // rather than waiting in a queue for a refusal.
  const verdict = screenWish(wish);
  if (!verdict.ok) return { ok: false, error: verdict.reason };

  // Writes go through the service role, as elsewhere in the cabinet: the row
  // level policy on this table grants select and nothing else, so the buyer's
  // own session cannot insert. Authorization is the ownership filter below.
  if (!supabaseAdmin) return { ok: false, error: "Baza bilan aloqa yo'q." };
  const supabase = supabaseAdmin;

  // Ownership is a filter on the write, as everywhere else: a forged handle
  // matches no row rather than being trusted and checked afterwards.
  const { data: owned } = await supabase
    .from("handles")
    .select("normalized")
    .eq("normalized", handle)
    .eq("user_id", userId)
    .maybeSingle();

  if (!owned) return { ok: false, error: "Bu handle sizniki emas." };

  const { error } = await supabase.from("design_requests").insert({
    handle,
    user_id: userId,
    wish: wish.trim(),
    prompt: buildDesignPrompt(wish),
  });

  if (error) {
    // The partial unique index is what enforces one at a time; catching its
    // code here turns a database error into something a person can act on.
    if (error.code === "23505") {
      return { ok: false, error: "Sizda navbatda turgan so'rov bor. U tayyor bo'lgach yana so'rang." };
    }
    return { ok: false, error: "So'rov saqlanmadi. Birozdan keyin urinib ko'ring." };
  }

  return { ok: true };
}
