"use server";

import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { priceForHandle } from "@/lib/pricing";
import { uploadImage, isStorageConfigured } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export type ClaimResult = { ok: true } | { ok: false; error: string };

function toLink(label: string, raw: string, prefix: string): { label: string; href: string } | null {
  const value = raw.trim();
  if (!value) return null;
  if (label === "Veb-sayt") {
    return { label, href: value.startsWith("http") ? value : `https://${value}` };
  }
  return { label, href: `${prefix}${value.replace(/^@/, "")}` };
}

export async function claimHandle(
  letters: string,
  digits: string,
  _prevState: ClaimResult,
  formData: FormData
): Promise<ClaimResult> {
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!name) {
    return { ok: false, error: "Ism kiritish shart." };
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return { ok: false, error: "Baza ulanmagan. Supabase kalitlari .env.local'da to'g'ri ekanini tekshiring." };
  }

  const links = [
    toLink("Telegram", String(formData.get("telegram") ?? ""), "https://t.me/"),
    toLink("Instagram", String(formData.get("instagram") ?? ""), "https://instagram.com/"),
    toLink("Veb-sayt", String(formData.get("website") ?? ""), ""),
  ].filter((l): l is { label: string; href: string } => l !== null);

  const price = priceForHandle(letters, digits);
  const normalized = `${letters}${digits}`;

  let avatarUrl: string | null = null;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0 && isStorageConfigured) {
    const buffer = Buffer.from(await avatar.arrayBuffer());
    const ext = avatar.type.split("/")[1] ?? "jpg";
    avatarUrl = await uploadImage(`handles/${normalized}.${ext}`, buffer, avatar.type);
  }

  const { error } = await supabaseAdmin.from("handles").insert({
    letters,
    digits,
    status: "claimed",
    owner_name: name,
    bio,
    avatar_url: avatarUrl,
    links,
    price_paid: price,
    claimed_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Bu handle allaqachon band qilingan." };
    }
    return { ok: false, error: "Xatolik yuz berdi. Qaytadan urinib ko'ring." };
  }

  revalidatePath(`/${normalized}`);
  return { ok: true };
}
