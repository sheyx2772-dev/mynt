"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parseHandle, priceForHandle } from "@/lib/pricing";
import { uploadImage, isStorageConfigured } from "@/lib/storage";
import { checkAvatar } from "@/lib/uploads";
import { getUser } from "@/lib/auth";
import { getSiteOrigin } from "@/lib/site";
import { checkClaimRateLimit, recordClaimAttempt, getClientIp } from "@/lib/rate-limit";
import { buildProfileLinks } from "@/lib/links";
import { clickCheckoutUrl } from "@/lib/payments/click";
import { paymeCheckoutUrl } from "@/lib/payments/payme";
import {
  clickConfig,
  paymeConfig,
  isClickConfigured,
  isPaymeConfigured,
  isAnyProviderConfigured,
} from "@/lib/payments/config";

// How long a handle is held while the buyer completes payment.
const RESERVATION_MINUTES = 30;

export type Checkout = { click?: string; payme?: string };

export type ClaimResult =
  | { ok: true; checkout?: Checkout }
  | { ok: false; error: string; needsAuth?: true };

type ProfileInput = {
  name: string;
  bio: string;
  links: { label: string; href: string }[];
  avatarUrl: string | null;
};

async function readProfile(
  formData: FormData,
  normalized: string
): Promise<{ ok: true; profile: ProfileInput } | { ok: false; error: string }> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 280);

  if (!name) return { ok: false, error: "Ism kiritish shart." };

  const links = buildProfileLinks({
    telegram: String(formData.get("telegram") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    website: String(formData.get("website") ?? ""),
  });

  let avatarUrl: string | null = null;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const check = checkAvatar(avatar);
    if (!check.ok) return { ok: false, error: check.error };

    if (isStorageConfigured) {
      const buffer = Buffer.from(await avatar.arrayBuffer());
      avatarUrl = await uploadImage(
        `handles/${normalized}.${check.extension}`,
        buffer,
        check.contentType
      );
    }
  }

  return { ok: true, profile: { name, bio, links, avatarUrl } };
}

export async function claimHandle(
  rawHandle: string,
  _prevState: ClaimResult,
  formData: FormData
): Promise<ClaimResult> {
  // The handle arrives from the client via `.bind`, which means it is
  // attacker-controlled. Re-parse it here instead of trusting the shape the
  // page rendered with — this is the boundary, not the URL.
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Handle formati noto'g'ri." };

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

  const read = await readProfile(formData, normalized);
  if (!read.ok) {
    await recordClaimAttempt(user.id, ip, normalized, false);
    return { ok: false, error: read.error };
  }
  const { profile } = read;

  // Price is always recomputed from the handle — never read from the form.
  const price = priceForHandle(letters, digits);

  // A reservation that was never paid for must not hold the handle forever.
  await supabaseAdmin
    .from("handles")
    .delete()
    .eq("normalized", normalized)
    .eq("status", "reserved")
    .lt("reserved_until", new Date().toISOString());

  // Without a payment provider the handle is claimed outright, which keeps the
  // site usable in development and before the merchant keys are connected.
  const settleNow = !isAnyProviderConfigured;

  const { error } = await supabaseAdmin.from("handles").insert({
    letters,
    digits,
    status: settleNow ? "claimed" : "reserved",
    user_id: user.id,
    owner_name: profile.name,
    bio: profile.bio,
    avatar_url: profile.avatarUrl,
    links: profile.links,
    price_paid: price,
    claimed_at: settleNow ? new Date().toISOString() : null,
    reserved_until: settleNow
      ? null
      : new Date(Date.now() + RESERVATION_MINUTES * 60_000).toISOString(),
  });

  if (error) {
    await recordClaimAttempt(user.id, ip, normalized, false);
    if (error.code === "23505") {
      return { ok: false, error: "Bu handle allaqachon band qilingan." };
    }
    return { ok: false, error: "Xatolik yuz berdi. Qaytadan urinib ko'ring." };
  }

  if (settleNow) {
    await recordClaimAttempt(user.id, ip, normalized, true);
    revalidatePath(`/${normalized}`);
    return { ok: true };
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({ user_id: user.id, handle: normalized, amount: price })
    .select("id")
    .single();

  if (orderError || !order) {
    // Do not sit on a reservation that has no order behind it.
    await supabaseAdmin
      .from("handles")
      .delete()
      .eq("normalized", normalized)
      .eq("status", "reserved");
    await recordClaimAttempt(user.id, ip, normalized, false);
    return { ok: false, error: "Buyurtma yaratilmadi. Qaytadan urinib ko'ring." };
  }

  await recordClaimAttempt(user.id, ip, normalized, true);

  const origin = await getSiteOrigin();
  const returnUrl = `${origin}/${normalized}`;
  const checkout: Checkout = {};

  if (isClickConfigured) {
    checkout.click = clickCheckoutUrl({
      serviceId: clickConfig.serviceId,
      merchantId: clickConfig.merchantId,
      amount: price,
      orderId: order.id,
      returnUrl,
    });
  }

  if (isPaymeConfigured) {
    checkout.payme = paymeCheckoutUrl({
      merchantId: paymeConfig.merchantId,
      orderId: order.id,
      amountSum: price,
      returnUrl,
    });
  }

  return { ok: true, checkout };
}
