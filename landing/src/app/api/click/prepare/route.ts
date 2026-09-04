import { NextResponse } from "next/server";
import { handleClickPrepare } from "@/lib/payments/click-handler";
import { readClickBody } from "@/lib/payments/request";
import { SupabasePaymentStore } from "@/lib/payments/supabase-store";
import { clickConfig, isClickConfigured } from "@/lib/payments/config";
import { CLICK_ERROR } from "@/lib/payments/click";

// Click's Prepare callback. Always answers 200 with the outcome in the body —
// Click reads the `error` field, not the HTTP status.
export async function POST(request: Request) {
  if (!isClickConfigured) {
    return NextResponse.json({
      error: CLICK_ERROR.ERROR_IN_REQUEST,
      error_note: "Payment provider is not configured",
    });
  }

  const body = await readClickBody(request);
  const result = await handleClickPrepare(new SupabasePaymentStore(), body, clickConfig.secretKey);

  return NextResponse.json(result);
}
