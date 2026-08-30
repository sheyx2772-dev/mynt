"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parseHandle, priceForHandle } from "@/lib/pricing";
import { uploadImage, isStorageConfigured } from "@/lib/storage";
import { checkAvatar } from "@/lib/uploads";
import { getUser } from "@/lib/auth";
import { checkClaimRateLimit, recordClaimAttempt, getClientIp } from "@/lib/rate-limit";
import { buildProfileLinks } from "@/lib/links";

export type ClaimResult =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; error: string; needsAuth: true };

export async function claimHandle(
  rawHandle: string,
  _prevState: ClaimResult,
  formData: FormData
): Promise<ClaimResult> {
  // The handle arrives from the client via `.bind`, which means it is
  // attacker-controlled. Re-parse it here instead of trusting the shape the
  // page rendered with — this is the boundary, not the URL.
  const parsed = parseHandle(rawHandle);
  if (!parsed) {
    return { ok: false, error: "Handle formati noto'g'ri." };
  }
  const { letters, digits } = parsed;
  const normalized = `${letters}${digits}`;

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      needsAuth: true,
      error: "Handle band qilish uchun avval hisobingizga kiring.",
    };
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return { ok: false, error: "Baza ulanmagan. Keyinroq urinib ko'ring." };
  }

  const ip = await getClientIp();
  const verdict = await checkClaimRateLimit(user.id, ip);
  if (!verdict.allowed) {
    await recordClaimAttempt(user.id, ip, normalized, false);
    return { ok: false, error: verdict.reason };
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 280);

  if (!name) {
    return { ok: false, error: "Ism kiritish shart." };
  }

  const links = buildProfileLinks({
    telegram: String(formData.get("telegram") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    website: String(formData.get("website") ?? ""),
  });

  let avatarUrl: string | null = null;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const check = checkAvatar(avatar);
    if (!check.ok) {
      await recordClaimAttempt(user.id, ip, normalized, false);
      return { ok: false, error: check.error };
    }
    if (isStorageConfigured) {
      const buffer = Buffer.from(await avatar.arrayBuffer());
      avatarUrl = await uploadImage(
        `handles/${normalized}.${check.extension}`,
        buffer,
        check.contentType
      );
    }
  }

  // Price is always recomputed from the handle — never read from the form.
  const price = priceForHandle(letters, digits);

  const { error } = await supabaseAdmin.from("handles").insert({
    letters,
    digits,
    status: "claimed",
    user_id: user.id,
    owner_name: name,
    bio,
    avatar_url: avatarUrl,
    links,
    price_paid: price,
    claimed_at: new Date().toISOString(),
  });

  if (error) {
    await recordClaimAttempt(user.id, ip, normalized, false);
    if (error.code === "23505") {
      return { ok: false, error: "Bu handle allaqachon band qilingan." };
    }
    return { ok: false, error: "Xatolik yuz berdi. Qaytadan urinib ko'ring." };
  }

  await recordClaimAttempt(user.id, ip, normalized, true);
  revalidatePath(`/${normalized}`);
  return { ok: true };
}
