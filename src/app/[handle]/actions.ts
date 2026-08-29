"use server";

import { pool, isDbConfigured } from "@/lib/db";
import { priceForHandle } from "@/lib/pricing";
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

  if (!isDbConfigured || !pool) {
    return { ok: false, error: "Baza ulanmagan. `npm run db:up` ishga tushirilganini tekshiring." };
  }

  const links = [
    toLink("Telegram", String(formData.get("telegram") ?? ""), "https://t.me/"),
    toLink("Instagram", String(formData.get("instagram") ?? ""), "https://instagram.com/"),
    toLink("Veb-sayt", String(formData.get("website") ?? ""), ""),
  ].filter((l): l is { label: string; href: string } => l !== null);

  const price = priceForHandle(letters, digits);
  const normalized = `${letters}${digits}`;

  try {
    const { rowCount } = await pool.query(
      `insert into handles (letters, digits, status, owner_name, bio, links, price_paid, claimed_at)
       values ($1, $2, 'claimed', $3, $4, $5::jsonb, $6, now())
       on conflict (normalized) do nothing`,
      [letters, digits, name, bio, JSON.stringify(links), price]
    );

    if (rowCount === 0) {
      return { ok: false, error: "Bu handle allaqachon band qilingan." };
    }
  } catch {
    return { ok: false, error: "Xatolik yuz berdi. Qaytadan urinib ko'ring." };
  }

  revalidatePath(`/${normalized}`);
  return { ok: true };
}
