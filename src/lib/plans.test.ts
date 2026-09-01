import { describe, it, expect } from "vitest";
import { activePlan, PLAN_ACCENT } from "./plans";

describe("activePlan", () => {
  const now = new Date("2026-09-01T12:00:00Z");

  it("is premium only while the subscription still holds", () => {
    expect(activePlan("premium", "2026-10-01T00:00:00Z", now)).toBe("premium");
  });

  // The number was paid for once and stays reachable; only the plan lapses.
  it("falls back to free when premium has run out", () => {
    expect(activePlan("premium", "2026-08-01T00:00:00Z", now)).toBe("free");
  });

  it("treats a premium row with no expiry as free", () => {
    expect(activePlan("premium", null, now)).toBe("free");
  });

  it("reads anything else as free", () => {
    expect(activePlan("free", null, now)).toBe("free");
    expect(activePlan(null, "2027-01-01T00:00:00Z", now)).toBe("free");
    expect(activePlan("gold", "2027-01-01T00:00:00Z", now)).toBe("free");
  });
});

describe("PLAN_ACCENT", () => {
  it("gives premium the gold and everyone else the brand lime", () => {
    expect(PLAN_ACCENT.premium).toBe("#d9c48f");
    expect(PLAN_ACCENT.free).toBe("#abff09");
  });
});
