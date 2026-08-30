"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseHandle } from "@/lib/pricing";
import { getUser } from "@/lib/auth";
import { readProfileForm } from "@/lib/profile-form";

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
    .select("avatar_url")
    .eq("normalized", normalized)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Bu handle sizga tegishli emas." };

  const read = await readProfileForm(formData, normalized, existing.avatar_url);
  if (!read.ok) return { ok: false, error: read.error };

  const { error } = await supabaseAdmin
    .from("handles")
    .update({
      owner_name: read.profile.name,
      bio: read.profile.bio,
      links: read.profile.links,
      avatar_url: read.profile.avatarUrl,
    })
    .eq("normalized", normalized)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Saqlanmadi. Qaytadan urinib ko'ring." };

  revalidatePath(`/${normalized}`);
  revalidatePath(`/kabinet/${normalized}`);
  revalidatePath("/kabinet");

  return { ok: true, saved: true };
}
