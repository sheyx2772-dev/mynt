"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseHandle } from "@/lib/pricing";
import { getUser } from "@/lib/auth";
import { saveProfile } from "@/lib/profile-save";
import { requestDesign } from "@/lib/design-requests";
import { offerTransfer, cancelTransfer, acceptTransfer } from "@/lib/transfers";

export type UpdateResult = {
  ok: boolean;
  error?: string;
  saved?: true;
  /** Saved, but the picture did not reach the store. See readProfileForm. */
  imageFailed?: true;
};

export async function updateProfile(
  rawHandle: string,
  _prevState: UpdateResult,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Handle formati noto'g'ri." };

  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  // The write itself lives in `@/lib/profile-save`, which the mobile route
  // also calls. What is left here is the half that is particular to a form
  // posted from this page: who the cookie says is asking, and the shape
  // `useActionState` expects back.
  const result = await saveProfile(`${parsed.letters}${parsed.digits}`, formData);
  if (!result.ok) return { ok: false, error: result.error };

  return { ok: true, saved: true, ...(result.imageFailed ? { imageFailed: true as const } : {}) };
}

export type PostResult = { ok: boolean; error?: string };

// A generous ceiling that still stops a script from filling the feed.
const POSTS_PER_HOUR = 20;

export async function createPost(
  rawHandle: string,
  _prevState: PostResult,
  formData: FormData
): Promise<PostResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Handle formati noto'g'ri." };

  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };
  if (!supabaseAdmin) return { ok: false, error: "Baza ulanmagan." };

  const body = String(formData.get("body") ?? "").trim().slice(0, 1000);
  if (!body) return { ok: false, error: "Post bo'sh bo'lmasligi kerak." };

  // Only a claimed handle can post: a reservation is an unfinished purchase.
  const { data: owned } = await supabaseAdmin
    .from("handles")
    .select("normalized")
    .eq("normalized", normalized)
    .eq("user_id", user.id)
    .eq("status", "claimed")
    .maybeSingle();

  if (!owned) return { ok: false, error: "Bu handle sizga tegishli emas." };

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= POSTS_PER_HOUR) {
    return { ok: false, error: "Bir soatda juda ko'p post. Birozdan so'ng urining." };
  }

  const { error } = await supabaseAdmin
    .from("posts")
    .insert({ handle: normalized, user_id: user.id, body });

  if (error) return { ok: false, error: "Post saqlanmadi. Qaytadan urinib ko'ring." };

  revalidatePath(`/${normalized}`);
  revalidatePath(`/kabinet/${normalized}/postlar`);
  revalidatePath("/lenta");

  return { ok: true };
}

export async function deletePost(postId: string): Promise<PostResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };
  if (!supabaseAdmin) return { ok: false, error: "Baza ulanmagan." };

  // The author filter is the authorization check: someone else's post simply
  // matches nothing.
  const { data } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id)
    .select("handle")
    .maybeSingle();

  if (!data) return { ok: false, error: "Post topilmadi." };

  revalidatePath(`/${data.handle}`);
  revalidatePath(`/kabinet/${data.handle}/postlar`);
  revalidatePath("/lenta");

  return { ok: true };
}

export type DesignRequestResult = { ok: boolean; error?: string; queued?: true };

export async function submitDesignRequest(
  rawHandle: string,
  _prevState: DesignRequestResult,
  formData: FormData
): Promise<DesignRequestResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Handle formati noto'g'ri." };
  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  const wish = String(formData.get("wish") ?? "");
  const result = await requestDesign(normalized, wish);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/kabinet/${normalized}/dizayn`);
  return { ok: true, queued: true };
}

export type TransferActionResult = { ok: boolean; error?: string; sent?: true };

export async function offerHandleTransfer(
  rawHandle: string,
  _prevState: TransferActionResult,
  formData: FormData
): Promise<TransferActionResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Handle formati noto'g'ri." };
  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user?.email) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await offerTransfer(
    normalized,
    String(formData.get("email") ?? "").trim().toLowerCase(),
  );
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/kabinet/${normalized}/otkazish`);
  return { ok: true, sent: true };
}

export async function cancelHandleTransfer(id: string): Promise<TransferActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await cancelTransfer(id);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/kabinet");
  return { ok: true };
}

export async function acceptHandleTransfer(id: string): Promise<TransferActionResult> {
  const user = await getUser();
  if (!user?.email) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await acceptTransfer(id);
  if (!result.ok) return { ok: false, error: result.error };

  // The number changed hands, so both cabinets and the profile itself are
  // stale. The profile path is not known here — the backend moved it — so the
  // cabinet is refreshed and the profile revalidates on its own next request.
  revalidatePath("/kabinet");
  return { ok: true };
}
