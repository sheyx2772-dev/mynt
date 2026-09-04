import { NextResponse } from "next/server";
import { handleClickComplete } from "@/lib/payments/click-handler";
import { readClickBody } from "@/lib/payments/request";
import { SupabasePaymentStore } from "@/lib/payments/supabase-store";
import { clickConfig, isClickConfigured } from "@/lib/payments/config";
import { CLICK_ERROR } from "@/lib/payments/click";

// Click's Complete callback — this is the one that settles the order.
export async function POST(request: Request) {
  if (!isClickConfigured) {
    return NextResponse.json({
      error: CLICK_ERROR.ERROR_IN_REQUEST,
      error_note: "Payment provider is not configured",
    });
  }

  const body = await readClickBody(request);
  const result = await handleClickComplete(new SupabasePaymentStore(), body, clickConfig.secretKey);

  return NextResponse.json(result);
}
