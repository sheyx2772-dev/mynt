import { describe, it, expect } from "vitest";
import { invoiceTotal } from "./invoices";
import { TEAM_SEAT_MONTHLY } from "./plans";

describe("invoiceTotal", () => {
  it("multiplies seats by months by the seat price", () => {
    expect(invoiceTotal(20, 12, 29_000)).toEqual({
      net: 6_960_000,
      vat: 0,
      total: 6_960_000,
    });
  });

  it("defaults to the current seat price", () => {
    expect(invoiceTotal(5, 1).net).toBe(5 * TEAM_SEAT_MONTHLY);
  });

  // Zero means somebody decided there is none, not that nobody thought about
  // it — so the arithmetic has to be right when it is set.
  it("adds VAT when it applies", () => {
    expect(invoiceTotal(10, 1, 29_000, 12)).toEqual({
      net: 290_000,
      vat: 34_800,
      total: 324_800,
    });
  });

  it("rounds VAT to whole so'm rather than leaving tiyin on a document", () => {
    const { vat } = invoiceTotal(7, 1, 29_000, 12);
    expect(Number.isInteger(vat)).toBe(true);
  });
});
