"use server";

import { getUser } from "@/lib/auth";
import { asReader } from "@/lib/backend/client";
import { parseHandle } from "@/lib/pricing";

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
 *
 * The price, the ownership check and the payment addresses are all the
 * backend's. Nothing about money is decided on this side.
 */
export async function startSubscription(
  rawHandle: string,
  period: "monthly" | "yearly",
): Promise<SubscribeResult> {
  const user = await getUser();
  if (!user) return { ok: false, needsAuth: true };

  const parsed = parseHandle(rawHandle);
  if (!parsed) return { ok: false, error: "Raqam noto'g'ri." };

  const client = await asReader();
  const { data, error, response } = await client.POST("/qidirish/{raqam}/obuna", {
    params: { path: { raqam: `${parsed.letters}${parsed.digits}` } },
    body: { muddat: period },
  });

  if (error || !data) {
    if (response?.status === 404) return { ok: false, error: "Bu raqam sizga tegishli emas." };
    // Nothing configured means nothing to pay with, and saying so is better
    // than a button that opens an empty page.
    if (response?.status === 503) {
      return { ok: false, error: "To'lov tizimi hali ulanmagan. Biz bilan bog'laning." };
    }
    return { ok: false, error: "Buyurtma yaratilmadi." };
  }

  return {
    ok: true,
    checkout: { click: data.buyurtma.tolov?.click, payme: data.buyurtma.tolov?.payme },
  };
}
