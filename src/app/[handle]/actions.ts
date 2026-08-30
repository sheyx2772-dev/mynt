"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parseHandle, priceForHandle } from "@/lib/pricing";
import { getUser } from "@/lib/auth";
import { getSiteOrigin } from "@/lib/site";
import { checkClaimRateLimit, recordClaimAttempt, getClientIp } from "@/lib/rate-limit";
import { readProfileForm } from "@/lib/profile-form";
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

  const read = await readProfileForm(formData, normalized);
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
    city: profile.city,
    contact_email: profile.contactEmail,
    tags: profile.tags,
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

export type FollowResult = { following: boolean; error?: string; needsAuth?: true };

// Follow or unfollow, decided by what is already stored rather than by what
// the client claims the current state is.
export async function toggleFollow(rawHandle: string): Promise<FollowResult> {
  const parsed = parseHandle(rawHandle);
  if (!parsed) return { following: false, error: "Handle formati noto'g'ri." };

  const normalized = `${parsed.letters}${parsed.digits}`;

  const user = await getUser();
  if (!user) {
    return { following: false, needsAuth: true, error: "Obuna uchun hisobingizga kiring." };
  }
  if (!supabaseAdmin) return { following: false, error: "Baza ulanmagan." };

  // Only a claimed handle can be followed, and nobody follows themselves.
  const { data: target } = await supabaseAdmin
    .from("handles")
    .select("user_id")
    .eq("normalized", normalized)
    .eq("status", "claimed")
    .maybeSingle();

  if (!target) return { following: false, error: "Bunday profil yo'q." };
  if (target.user_id === user.id) {
    return { following: false, error: "O'zingizga obuna bo'lolmaysiz." };
  }

  const { data: existing } = await supabaseAdmin
    .from("follows")
    .select("followed_handle")
    .eq("follower_user_id", user.id)
    .eq("followed_handle", normalized)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("follows")
      .delete()
      .eq("follower_user_id", user.id)
      .eq("followed_handle", normalized);
    revalidatePath(`/${normalized}`);
    return { following: false };
  }

  const { error } = await supabaseAdmin
    .from("follows")
    .insert({ follower_user_id: user.id, followed_handle: normalized });

  // A duplicate means a double click landed twice; the end state is the same.
  if (error && error.code !== "23505") {
    return { following: false, error: "Xatolik yuz berdi." };
  }

  revalidatePath(`/${normalized}`);
  return { following: true };
}
