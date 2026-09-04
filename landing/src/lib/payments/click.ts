import { createHash, timingSafeEqual } from "node:crypto";

// Click Merchant (SHOP API) — https://docs.click.uz/en/merchant-api-request/
//
// Click calls two endpoints in order: Prepare, then Complete. Both requests
// carry an MD5 signature over a fixed concatenation of fields. The two
// signatures differ: Complete inserts `merchant_prepare_id` after
// `merchant_trans_id`. Getting that wrong means every payment is rejected as
// an invalid signature, so the two formulas are spelled out separately below.

export const CLICK_ERROR = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INCORRECT_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  FAILED_TO_UPDATE_USER: -7,
  ERROR_IN_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
} as const;

// Click sends these as the `action` field, and the same value is part of the
// signature.
export const CLICK_ACTION = {
  PREPARE: "0",
  COMPLETE: "1",
} as const;

export type ClickRequest = {
  click_trans_id: string;
  service_id: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  sign_time: string;
  sign_string: string;
  error?: string;
};

// Prepare:  click_trans_id + service_id + SECRET + merchant_trans_id + amount + action + sign_time
// Complete: click_trans_id + service_id + SECRET + merchant_trans_id + merchant_prepare_id + amount + action + sign_time
export function clickSignString(req: ClickRequest, secretKey: string): string {
  const parts: string[] = [req.click_trans_id, req.service_id, secretKey, req.merchant_trans_id];

  if (req.action === CLICK_ACTION.COMPLETE) {
    parts.push(req.merchant_prepare_id ?? "");
  }

  parts.push(req.amount, req.action, req.sign_time);

  return createHash("md5").update(parts.join("")).digest("hex");
}

export function verifyClickSignature(req: ClickRequest, secretKey: string): boolean {
  if (!secretKey) return false;

  const expected = clickSignString(req, secretKey);
  const received = req.sign_string ?? "";

  // Compare in constant time so a wrong signature can't be narrowed down by
  // measuring how long the rejection takes.
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

// Click sends amounts as a decimal string of so'm ("99000" or "99000.00").
// Compare in tiyin to avoid float equality problems.
export function clickAmountMatches(received: string, expectedSum: number): boolean {
  const parsed = Number(received);
  if (!Number.isFinite(parsed)) return false;
  return Math.round(parsed * 100) === Math.round(expectedSum * 100);
}

// Hosted checkout URL the user is redirected to.
export function clickCheckoutUrl(opts: {
  serviceId: string;
  merchantId: string;
  amount: number;
  orderId: string;
  returnUrl?: string;
}): string {
  const url = new URL("https://my.click.uz/services/pay");
  url.searchParams.set("service_id", opts.serviceId);
  url.searchParams.set("merchant_id", opts.merchantId);
  url.searchParams.set("amount", String(opts.amount));
  url.searchParams.set("transaction_param", opts.orderId);
  if (opts.returnUrl) url.searchParams.set("return_url", opts.returnUrl);
  return url.toString();
}
