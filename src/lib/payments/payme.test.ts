import { describe, it, expect } from "vitest";
import {
  verifyPaymeAuth,
  rpcResult,
  rpcError,
  paymeAmountMatches,
  sumToTiyin,
  tiyinToSum,
  isTransactionExpired,
  cancelledState,
  paymeCheckoutUrl,
  PAYME_ERROR,
  PAYME_STATE,
  PAYME_TIMEOUT_MS,
} from "./payme";

const KEY = "test-merchant-key";

describe("verifyPaymeAuth", () => {
  it("accepts Basic auth built from Paycom and the merchant key", () => {
    const header = `Basic ${Buffer.from(`Paycom:${KEY}`).toString("base64")}`;
    expect(verifyPaymeAuth(header, KEY)).toBe(true);
  });

  it("rejects a wrong key, wrong username, or missing header", () => {
    expect(verifyPaymeAuth(`Basic ${Buffer.from("Paycom:wrong").toString("base64")}`, KEY)).toBe(
      false
    );
    expect(verifyPaymeAuth(`Basic ${Buffer.from(`Other:${KEY}`).toString("base64")}`, KEY)).toBe(
      false
    );
    expect(verifyPaymeAuth(null, KEY)).toBe(false);
    expect(verifyPaymeAuth("", KEY)).toBe(false);
  });

  it("fails closed when the key is not configured", () => {
    const header = `Basic ${Buffer.from("Paycom:").toString("base64")}`;
    expect(verifyPaymeAuth(header, "")).toBe(false);
  });
});

describe("rpc envelopes", () => {
  it("echoes the request id and tags the version", () => {
    expect(rpcResult(42, { allow: true })).toEqual({
      jsonrpc: "2.0",
      id: 42,
      result: { allow: true },
    });
  });

  // Payme expects error messages keyed by language, not a bare string.
  it("returns localized error messages", () => {
    const err = rpcError(7, PAYME_ERROR.INVALID_AMOUNT, "Noto'g'ri summa");
    expect(err).toMatchObject({
      jsonrpc: "2.0",
      id: 7,
      error: { code: -31001, message: { ru: expect.any(String), uz: expect.any(String), en: expect.any(String) } },
    });
  });
});

describe("amounts", () => {
  it("converts between so'm and tiyin", () => {
    expect(sumToTiyin(99000)).toBe(9_900_000);
    expect(tiyinToSum(9_900_000)).toBe(99000);
  });

  it("matches only the exact tiyin amount", () => {
    expect(paymeAmountMatches(9_900_000, 99000)).toBe(true);
    expect(paymeAmountMatches(9_900_001, 99000)).toBe(false);
    // A so'm amount sent where tiyin is expected must not pass.
    expect(paymeAmountMatches(99000, 99000)).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(paymeAmountMatches("9900000", 99000)).toBe(false);
    expect(paymeAmountMatches(null, 99000)).toBe(false);
    expect(paymeAmountMatches(undefined, 99000)).toBe(false);
  });
});

describe("isTransactionExpired", () => {
  const created = 1_700_000_000_000;

  it("holds a transaction open for 12 hours", () => {
    expect(isTransactionExpired(created, created)).toBe(false);
    expect(isTransactionExpired(created, created + PAYME_TIMEOUT_MS)).toBe(false);
  });

  it("expires it after 12 hours", () => {
    expect(isTransactionExpired(created, created + PAYME_TIMEOUT_MS + 1)).toBe(true);
  });
});

describe("cancelledState", () => {
  // Cancelling before payment is a cancellation (-1); after payment it is a
  // refund (-2). Payme checks that the two are reported differently.
  it("distinguishes a cancellation from a refund", () => {
    expect(cancelledState(PAYME_STATE.CREATED)).toBe(PAYME_STATE.CANCELLED);
    expect(cancelledState(PAYME_STATE.PERFORMED)).toBe(PAYME_STATE.CANCELLED_AFTER_PERFORM);
  });
});

describe("paymeCheckoutUrl", () => {
  it("base64-encodes the merchant, account and amount", () => {
    const url = paymeCheckoutUrl({
      merchantId: "merch-1",
      orderId: "order-abc",
      amountSum: 99000,
    });
    expect(url.startsWith("https://checkout.paycom.uz/")).toBe(true);

    const payload = Buffer.from(url.split("/").pop()!, "base64").toString();
    expect(payload).toBe("m=merch-1;ac.order_id=order-abc;a=9900000");
  });
});
