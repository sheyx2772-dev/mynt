import { NextResponse } from "next/server";
import { handlePaymeRequest } from "@/lib/payments/payme-handler";
import { verifyPaymeAuth, rpcError, PAYME_ERROR, type RpcRequest } from "@/lib/payments/payme";
import { SupabasePaymentStore } from "@/lib/payments/supabase-store";
import { paymeConfig, isPaymeConfigured } from "@/lib/payments/config";

// Payme's single JSON-RPC endpoint. Every reply is HTTP 200, including
// failures — Payme reads the `error` member of the envelope.
export async function POST(request: Request) {
  let body: RpcRequest;
  try {
    body = (await request.json()) as RpcRequest;
  } catch {
    return NextResponse.json(rpcError(0, PAYME_ERROR.PARSE, "Parse error"));
  }

  const id = body?.id ?? 0;

  if (!isPaymeConfigured) {
    return NextResponse.json(
      rpcError(id, PAYME_ERROR.INSUFFICIENT_PRIVILEGE, "Payment provider is not configured")
    );
  }

  // Authenticate before touching the store, so an unauthenticated caller
  // cannot probe which orders exist.
  if (!verifyPaymeAuth(request.headers.get("authorization"), paymeConfig.secretKey)) {
    return NextResponse.json(
      rpcError(id, PAYME_ERROR.INSUFFICIENT_PRIVILEGE, "Not authorized")
    );
  }

  if (!body?.method || typeof body.method !== "string") {
    return NextResponse.json(rpcError(id, PAYME_ERROR.INVALID_REQUEST, "Invalid request"));
  }

  const result = await handlePaymeRequest(new SupabasePaymentStore(), {
    id,
    method: body.method,
    params: body.params ?? {},
  });

  return NextResponse.json(result);
}
