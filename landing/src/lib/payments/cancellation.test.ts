import { describe, expect, it } from "vitest";

import { cancellationEffect } from "./cancellation";

describe("cancellationEffect", () => {
  it("gives an unpaid handle order back to the pool", () => {
    expect(cancellationEffect("handle", "pending", null)).toEqual({ undo: "release-handle" });
  });

  it("takes a refunded handle back too", () => {
    // The buyer got their money back, so they do not keep the number.
    expect(cancellationEffect("handle", "paid", null)).toEqual({ undo: "release-handle" });
  });

  it("never touches the number when a device order is cancelled", () => {
    // The bug this file exists for. A device order carries the handle its buyer
    // already owns, and the old rule released it — deleting a claimed, paid
    // number because a ring was refunded.
    expect(cancellationEffect("device", "paid", null)).toEqual({ undo: "nothing" });
    expect(cancellationEffect("device", "pending", null)).toEqual({ undo: "nothing" });
  });

  it("never touches the number when a subscription is cancelled", () => {
    expect(cancellationEffect("subscription", "paid", 12)).toEqual({
      undo: "subtract-months",
      months: 12,
    });
    expect(cancellationEffect("subscription", "paid", null)).toEqual({
      undo: "subtract-months",
      months: 1,
    });
  });

  it("subtracts nothing from a subscription that was never paid", () => {
    // It extended nothing, so subtracting would take time the owner paid for on
    // an earlier order.
    expect(cancellationEffect("subscription", "pending", 12)).toEqual({ undo: "nothing" });
  });

  it("does nothing for a kind it does not recognise", () => {
    // A fourth kind of order arriving without this file being touched must
    // leave a paid asset alone and be noticed — not destroy one by default,
    // which is exactly how `device` came to delete numbers.
    for (const kind of ["vizitka", "", null, undefined, "HANDLE"]) {
      expect(cancellationEffect(kind, "paid", 1)).toEqual({ undo: "nothing" });
    }
  });
});
