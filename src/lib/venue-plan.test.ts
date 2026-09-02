import { describe, expect, it } from "vitest";

import { planState, venueInvoiceTotal, isMonthOption } from "./venue-plan";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 3, 12, 0, 0);

describe("planState", () => {
  it("counts the days a venue has left", () => {
    const state = planState(new Date(NOW + 10 * DAY).toISOString(), NOW);
    expect(state).toMatchObject({ daysLeft: 10, active: true, endingSoon: false });
  });

  it("says so before it runs out, not after", () => {
    expect(planState(new Date(NOW + 5 * DAY).toISOString(), NOW).endingSoon).toBe(true);
    expect(planState(new Date(NOW + 8 * DAY).toISOString(), NOW).endingSoon).toBe(false);
  });

  it("is not active once the date has passed", () => {
    const state = planState(new Date(NOW - DAY).toISOString(), NOW);
    expect(state.active).toBe(false);
    // Expired is not "ending soon": there is nothing left to warn about.
    expect(state.endingSoon).toBe(false);
    expect(state.daysLeft).toBeLessThan(0);
  });

  it("treats the last hour of the last day as still paid for", () => {
    const state = planState(new Date(NOW + 60 * 60 * 1000).toISOString(), NOW);
    expect(state.active).toBe(true);
  });
});

describe("venueInvoiceTotal", () => {
  it("charges the band per month, not per point", () => {
    // Twelve tables at 149,000 for three months. Charging per point would put
    // the same venue at nearly two million, which is the mistake the price
    // bands exist to avoid.
    expect(venueInvoiceTotal(12, 3, 149_000)).toEqual({
      net: 447_000,
      vat: 0,
      total: 447_000,
    });
  });

  it("adds VAT as a decided number rather than an assumption", () => {
    expect(venueInvoiceTotal(12, 1, 149_000, 12)).toEqual({
      net: 149_000,
      vat: 17_880,
      total: 166_880,
    });
  });
});

describe("isMonthOption", () => {
  it("accepts only the terms that are sold", () => {
    expect(isMonthOption(3)).toBe(true);
    expect(isMonthOption(5)).toBe(false);
    expect(isMonthOption("3")).toBe(false);
  });
});
