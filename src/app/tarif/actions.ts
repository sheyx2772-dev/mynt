"use server";

import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseHandle } from "@/lib/pricing";
import { plan } from "@/lib/plans";
import { getSiteOrigin } from "@/lib/site";
import { clickCheckoutUrl } from "@/lib/payments/click";
import { paymeCheckoutUrl } from "@/lib/payments/payme";
import {
  clickConfig,
  paymeConfig,
  isClickConfigured,
  isPaymeConfigured,
} from "@/lib/payments/config";

export type SubscribeResult = {
  ok: boolean;
  error?: string;
  needsAuth?: true;
  checkout?: { click?: string; payme?: string };
};

/**
 * Buying premium for a fixed period.
 *
 * Not a recurring charge: the providers here do card-on-file through a separate
 * tokenised API, and holding a card we cannot cancel from this codebase would
 * be worse for the buyer than asking them to renew. So this sells one month or
 * one year, and the plan simply runs out if nobody renews — the number stays
 * theirs and the profile stays up either way.
 */
export async function startSubscription(
  rawHandle: string,
  period: "monthly" | "yearly",
): Promise<SubscribeResult> {
  const user = await getUser();
  if (!user) return { ok: false, needsAuth: true };

  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam noto'g'ri." };
  const normalized = `${parsed.letters}${parsed.digits}`;

  if (!supabaseAdmin) return { ok: false, error: "Hozir to'lov qabul qilinmayapti." };

  // Ownership is the authorization: a handle the buyer does not own is simply
  // not found, so nobody can put another person's profile on a plan.
  const { data: owned } = await supabaseAdmin
    .from("handles")
    .select("normalized")
    .eq("normalized", normalized)
    .eq("user_id", user.id)
    .eq("status", "claimed")
    .maybeSingle();

  if (!owned) return { ok: false, error: "Bu raqam sizga tegishli emas." };

  const premium = plan("premium");
  const months = period === "yearly" ? 12 : 1;
  const amount = period === "yearly" ? premium.yearly : premium.monthly;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: user.id,
      handle: normalized,
      amount,
      kind: "subscription",
      months,
    })
    .select("id")
    .single();

  if (error || !order) return { ok: false, error: "Buyurtma yaratilmadi." };

  const origin = await getSiteOrigin();
  const returnUrl = `${origin}/kabinet/${normalized}`;
  const checkout: SubscribeResult["checkout"] = {};

  if (isClickConfigured) {
    checkout.click = clickCheckoutUrl({
      serviceId: clickConfig.serviceId,
      merchantId: clickConfig.merchantId,
      amount,
      orderId: order.id,
      returnUrl,
    });
  }

  if (isPaymeConfigured) {
    checkout.payme = paymeCheckoutUrl({
      merchantId: paymeConfig.merchantId,
      orderId: order.id,
      amountSum: amount,
      returnUrl,
    });
  }

  // Nothing configured means nothing to pay with, and saying so is better than
  // a button that opens an empty page.
  if (!checkout.click && !checkout.payme) {
    return { ok: false, error: "To'lov tizimi hali ulanmagan. Biz bilan bog'laning." };
  }

  return { ok: true, checkout };
}
