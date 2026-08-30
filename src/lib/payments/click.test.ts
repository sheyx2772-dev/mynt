import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import {
  clickSignString,
  verifyClickSignature,
  clickAmountMatches,
  clickCheckoutUrl,
  CLICK_ACTION,
  type ClickRequest,
} from "./click";

const SECRET = "test-secret-key";

const base: ClickRequest = {
  click_trans_id: "1234567",
  service_id: "12345",
  merchant_trans_id: "order-abc",
  amount: "99000",
  action: CLICK_ACTION.PREPARE,
  sign_time: "2026-08-30 12:00:00",
  sign_string: "",
};

// The expected hashes are written out longhand from Click's specification so
// the test restates the rule instead of re-running the implementation.
function md5(s: string) {
  return createHash("md5").update(s).digest("hex");
}

describe("clickSignString", () => {
  it("matches the documented Prepare formula", () => {
    const expected = md5(
      "1234567" + "12345" + SECRET + "order-abc" + "99000" + "0" + "2026-08-30 12:00:00"
    );
    expect(clickSignString(base, SECRET)).toBe(expected);
  });

  it("matches the documented Complete formula, which adds merchant_prepare_id", () => {
    const complete: ClickRequest = {
      ...base,
      action: CLICK_ACTION.COMPLETE,
      merchant_prepare_id: "prep-99",
    };
    const expected = md5(
      "1234567" +
        "12345" +
        SECRET +
        "order-abc" +
        "prep-99" +
        "99000" +
        "1" +
        "2026-08-30 12:00:00"
    );
    expect(clickSignString(complete, SECRET)).toBe(expected);
  });

  // Regression: an earlier implementation reused the Prepare formula for
  // Complete, omitting merchant_prepare_id. Every Complete was then rejected.
  it("does not reuse the Prepare formula for Complete", () => {
    const complete: ClickRequest = {
      ...base,
      action: CLICK_ACTION.COMPLETE,
      merchant_prepare_id: "prep-99",
    };
    expect(clickSignString(complete, SECRET)).not.toBe(clickSignString(base, SECRET));
  });

  // Regression: an earlier implementation put `error` where `action` belongs.
  // On a successful payment error is "0" and action is "1", so the signature
  // never matched and no payment could complete.
  it("signs with action, not with the error field", () => {
    const complete: ClickRequest = {
      ...base,
      action: CLICK_ACTION.COMPLETE,
      merchant_prepare_id: "prep-99",
      error: "0",
    };
    const wrong = md5(
      "1234567" + "12345" + SECRET + "order-abc" + "prep-99" + "99000" + "0" + "2026-08-30 12:00:00"
    );
    expect(clickSignString(complete, SECRET)).not.toBe(wrong);
  });

  it("changes when any signed field changes", () => {
    const original = clickSignString(base, SECRET);
    expect(clickSignString({ ...base, amount: "99001" }, SECRET)).not.toBe(original);
    expect(clickSignString({ ...base, merchant_trans_id: "order-xyz" }, SECRET)).not.toBe(original);
    expect(clickSignString(base, "other-secret")).not.toBe(original);
  });
});

describe("verifyClickSignature", () => {
  it("accepts a correctly signed request", () => {
    const req = { ...base };
    req.sign_string = clickSignString(req, SECRET);
    expect(verifyClickSignature(req, SECRET)).toBe(true);
  });

  it("rejects a tampered amount", () => {
    const req = { ...base };
    req.sign_string = clickSignString(req, SECRET);
    expect(verifyClickSignature({ ...req, amount: "1" }, SECRET)).toBe(false);
  });

  it("rejects an empty or malformed signature without throwing", () => {
    expect(verifyClickSignature({ ...base, sign_string: "" }, SECRET)).toBe(false);
    expect(verifyClickSignature({ ...base, sign_string: "short" }, SECRET)).toBe(false);
  });

  // A missing secret must fail closed, not sign everything with "undefined".
  it("rejects everything when the secret is not configured", () => {
    const req = { ...base };
    req.sign_string = clickSignString(req, SECRET);
    expect(verifyClickSignature(req, "")).toBe(false);
  });
});

describe("clickAmountMatches", () => {
  it("accepts equal amounts in either notation", () => {
    expect(clickAmountMatches("99000", 99000)).toBe(true);
    expect(clickAmountMatches("99000.00", 99000)).toBe(true);
  });

  it("rejects a mismatch or unparseable input", () => {
    expect(clickAmountMatches("98999", 99000)).toBe(false);
    expect(clickAmountMatches("abc", 99000)).toBe(false);
    expect(clickAmountMatches("", 99000)).toBe(false);
  });
});

describe("clickCheckoutUrl", () => {
  it("builds the hosted checkout link", () => {
    const url = new URL(
      clickCheckoutUrl({
        serviceId: "12345",
        merchantId: "6789",
        amount: 99000,
        orderId: "order-abc",
      })
    );
    expect(url.origin + url.pathname).toBe("https://my.click.uz/services/pay");
    expect(url.searchParams.get("service_id")).toBe("12345");
    expect(url.searchParams.get("amount")).toBe("99000");
    expect(url.searchParams.get("transaction_param")).toBe("order-abc");
  });
});
