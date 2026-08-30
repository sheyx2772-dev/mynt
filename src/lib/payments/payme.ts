import { timingSafeEqual } from "node:crypto";

// Payme Merchant API — https://developer.help.paycom.uz/metody-merchant-api/
//
// Payme speaks JSON-RPC over a single endpoint and drives a transaction state
// machine. The merchant must persist each transaction: after CreateTransaction,
// Payme identifies it only by its own `id`, so CheckTransaction and
// CancelTransaction arrive with no account information. Without a stored
// id -> order mapping those methods cannot be answered, and the mandatory
// sandbox certification fails.

export const PAYME_ERROR = {
  // Transport / RPC level
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INSUFFICIENT_PRIVILEGE: -32504,
  // Merchant level
  INVALID_AMOUNT: -31001,
  INVALID_ACCOUNT: -31050,
  CANT_PERFORM: -31008,
  TRANSACTION_NOT_FOUND: -31003,
  CANT_CANCEL: -31007,
} as const;

export const PAYME_STATE = {
  CREATED: 1,
  PERFORMED: 2,
  CANCELLED: -1,
  CANCELLED_AFTER_PERFORM: -2,
} as const;

export type PaymeState = (typeof PAYME_STATE)[keyof typeof PAYME_STATE];

// Payme abandons a transaction that stays in the created state this long.
export const PAYME_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export type RpcRequest = {
  id: number | string;
  method: string;
  params: Record<string, unknown>;
};

export function rpcResult(id: RpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

export function rpcError(id: RpcRequest["id"], code: number, message: string, data?: string) {
  // Payme expects the message in three languages; the same text is fine when
  // a translation isn't available, but the shape must be an object.
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message: { ru: message, uz: message, en: message }, data },
  };
}

// Payme authenticates with HTTP Basic where the username is literally
// "Paycom" and the password is the merchant key.
export function verifyPaymeAuth(authorizationHeader: string | null, key: string): boolean {
  if (!key || !authorizationHeader) return false;

  const expected = `Basic ${Buffer.from(`Paycom:${key}`).toString("base64")}`;
  if (expected.length !== authorizationHeader.length) return false;

  return timingSafeEqual(Buffer.from(expected), Buffer.from(authorizationHeader));
}

// Amounts arrive in tiyin; orders are priced in so'm.
export function tiyinToSum(tiyin: number): number {
  return tiyin / 100;
}

export function sumToTiyin(sum: number): number {
  return Math.round(sum * 100);
}

export function paymeAmountMatches(receivedTiyin: unknown, expectedSum: number): boolean {
  return typeof receivedTiyin === "number" && receivedTiyin === sumToTiyin(expectedSum);
}

export function isTransactionExpired(createTimeMs: number, now: number): boolean {
  return now - createTimeMs > PAYME_TIMEOUT_MS;
}

// Cancelling a transaction that was already performed is a refund, and Payme
// distinguishes the two with different terminal states.
export function cancelledState(current: PaymeState): PaymeState {
  return current === PAYME_STATE.PERFORMED
    ? PAYME_STATE.CANCELLED_AFTER_PERFORM
    : PAYME_STATE.CANCELLED;
}

// Hosted checkout: Payme reads a base64 payload from the URL.
export function paymeCheckoutUrl(opts: {
  merchantId: string;
  orderId: string;
  amountSum: number;
  returnUrl?: string;
}): string {
  const parts = [
    `m=${opts.merchantId}`,
    `ac.order_id=${opts.orderId}`,
    `a=${sumToTiyin(opts.amountSum)}`,
  ];
  if (opts.returnUrl) parts.push(`c=${opts.returnUrl}`);

  const payload = Buffer.from(parts.join(";")).toString("base64");
  return `https://checkout.paycom.uz/${payload}`;
}
