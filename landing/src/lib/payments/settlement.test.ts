import { describe, expect, it } from "vitest";

import { settledByAnother } from "./settlement";
import type { Order } from "./store";

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    userId: "u1",
    handle: "MYN042",
    amount: 100_000,
    status: "pending",
    provider: null,
    ...overrides,
  };
}

describe("settledByAnother", () => {
  it("stops the second provider settling an order the first already did", () => {
    // The double charge this exists to prevent.
    expect(settledByAnother(order({ status: "paid", provider: "click" }), "payme")).toBe(true);
    expect(settledByAnother(order({ status: "paid", provider: "payme" }), "click")).toBe(true);
  });

  it("lets a provider settle its own order again", () => {
    // A provider that retries must get its own success back, or it retries
    // forever and eventually raises a dispute.
    expect(settledByAnother(order({ status: "paid", provider: "payme" }), "payme")).toBe(false);
    expect(settledByAnother(order({ status: "paid", provider: "click" }), "click")).toBe(false);
  });

  it("does not block an order nobody has settled", () => {
    expect(settledByAnother(order(), "payme")).toBe(false);
    expect(settledByAnother(order({ status: "pending", provider: null }), "click")).toBe(false);
  });

  it("does not block on a cancelled order, which has its own refusal", () => {
    // Cancelled is answered elsewhere with the error the provider expects for
    // it; treating it as "somebody else paid" would send the wrong code.
    expect(settledByAnother(order({ status: "cancelled", provider: "payme" }), "click")).toBe(false);
  });

  it("does not block when the paid order names no provider", () => {
    // A handle given away with no provider configured is marked paid without
    // one. Nothing is owed, so nothing is blocked.
    expect(settledByAnother(order({ status: "paid", provider: null }), "click")).toBe(false);
  });
});
