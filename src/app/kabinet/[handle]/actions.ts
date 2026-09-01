"use server";

import { activePlan } from "@/lib/plans";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseHandle } from "@/lib/pricing";
import { getUser } from "@/lib/auth";
import { readProfileForm } from "@/lib/profile-form";
import { isCardDesign, DEFAULT_CARD_DESIGN } from "@/lib/card-designs";
import { isDeviceType, DEFAULT_DEVICE_TYPE } from "@/lib/devices";
import { requestDesign } from "@/lib/design-requests";
import { offerTransfer, cancelTransfer, acceptTransfer } from "@/lib/transfers";

export type UpdateResult = { ok: boolean; error?: string; saved?: true };

export async function updateProfile(
  rawHandle: string,
  _prevState: UpdateResult,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Handle formati noto'g'ri." };

  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  if (!supabaseAdmin) return { ok: false, error: "Baza ulanmagan." };

  // Read the current row through the ownership filter. This is the
  // authorization check: a handle the user does not own simply is not found,
  // and the update below carries the same filter so it cannot be widened.
  const { data: existing } = await supabaseAdmin
    .from("handles")
    .select("avatar_url, banner_url, plan, plan_expires_at")
    .eq("normalized", normalized)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Bu handle sizga tegishli emas." };

  const design = String(formData.get("cardDesign") ?? "");
  const device = String(formData.get("deviceType") ?? "");
  const read = await readProfileForm(
    formData,
    normalized,
    existing.avatar_url,
    existing.banner_url,
    activePlan(existing.plan, existing.plan_expires_at),
  );
  if (!read.ok) return { ok: false, error: read.error };

  const { error } = await supabaseAdmin
    .from("handles")
    .update({
      owner_name: read.profile.name,
      bio: read.profile.bio,
      links: read.profile.links,
      avatar_url: read.profile.avatarUrl,
      banner_url: read.profile.bannerUrl,
      city: read.profile.city,
      contact_email: read.profile.contactEmail,
      phone: read.profile.phone,
      position: read.profile.position,
      company: read.profile.company,
      services: read.profile.services,
      tags: read.profile.tags,
      // Anything the renderer does not know is refused here and by a check
      // constraint, so a card can never reference a design that cannot draw.
      card_design: isCardDesign(design) ? design : DEFAULT_CARD_DESIGN,
      device_type: isDeviceType(device) ? device : DEFAULT_DEVICE_TYPE,
    })
    .eq("normalized", normalized)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Saqlanmadi. Qaytadan urinib ko'ring." };

  revalidatePath(`/${normalized}`);
  revalidatePath(`/kabinet/${normalized}`);
  revalidatePath("/kabinet");

  return { ok: true, saved: true };
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
  revalidatePath(`/kabinet/${normalized}`);
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
  revalidatePath(`/kabinet/${data.handle}`);
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
  const result = await requestDesign(user.id, normalized, wish);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/kabinet/${normalized}`);
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
    user.id,
    user.email,
    normalized,
    String(formData.get("email") ?? "")
  );
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/kabinet/${normalized}`);
  return { ok: true, sent: true };
}

export async function cancelHandleTransfer(id: string): Promise<TransferActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await cancelTransfer(user.id, id);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/kabinet");
  return { ok: true };
}

export async function acceptHandleTransfer(id: string): Promise<TransferActionResult> {
  const user = await getUser();
  if (!user?.email) return { ok: false, error: "Avval hisobingizga kiring." };

  const result = await acceptTransfer(user.id, user.email, id);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/kabinet");
  revalidatePath(`/${result.handle}`);
  return { ok: true };
}
