import "server-only";

import { revalidatePath } from "next/cache";

import { activePlan } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { readProfileForm } from "@/lib/profile-form";
import { isCardDesign, DEFAULT_CARD_DESIGN } from "@/lib/card-designs";
import { isDeviceType, DEFAULT_DEVICE_TYPE } from "@/lib/devices";

// Writing a profile, for whoever asked.
//
// This used to live inside the cabinet's server action, which was the only way
// in. The phone is a second way in, and a second copy of this would be two
// validation paths against one row — the weaker of which decides what the
// database ends up holding. So the action and the mobile route both call here,
// and neither knows how the other authenticated.
//
// What they must each do first is establish *who* is asking. This function
// takes a user id and trusts it completely: it is the caller's job to have
// verified a cookie or a token, and no field of `formData` is ever consulted
// for identity.

export type SaveProfileResult =
  | { ok: true; imageFailed?: true }
  | { ok: false; error: string };

export async function saveProfile(
  normalized: string,
  userId: string,
  formData: FormData,
): Promise<SaveProfileResult> {
  if (!supabaseAdmin) return { ok: false, error: "Baza ulanmagan." };

  // Read the current row through the ownership filter. This is the
  // authorization check: a handle the user does not own simply is not found,
  // and the update below carries the same filter so it cannot be widened.
  const { data: existing } = await supabaseAdmin
    .from("handles")
    .select("avatar_url, banner_url, plan, plan_expires_at")
    .eq("normalized", normalized)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Bu handle sizga tegishli emas." };

  const design = String(formData.get("cardDesign") ?? "");
  const device = String(formData.get("deviceType") ?? "");

  const read = await readProfileForm(
    formData,
    normalized,
    existing.avatar_url,
    existing.banner_url,
    // The plan is read from the row, never from the request. A client that
    // sends `plan=premium` is describing itself, not granting itself anything.
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
      comments_open: read.profile.commentsOpen,
      tags: read.profile.tags,
      // Anything the renderer does not know is refused here and by a check
      // constraint, so a card can never reference a design that cannot draw.
      card_design: isCardDesign(design) ? design : DEFAULT_CARD_DESIGN,
      device_type: isDeviceType(device) ? device : DEFAULT_DEVICE_TYPE,
    })
    .eq("normalized", normalized)
    .eq("user_id", userId);

  if (error) return { ok: false, error: "Saqlanmadi. Qaytadan urinib ko'ring." };

  revalidatePath(`/${normalized}`);
  revalidatePath(`/kabinet/${normalized}/tahrirlash`);
  revalidatePath(`/kabinet/${normalized}`);
  revalidatePath("/kabinet");

  return { ok: true, ...(read.imageFailed ? { imageFailed: true as const } : {}) };
}
