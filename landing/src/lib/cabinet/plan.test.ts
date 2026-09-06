import { describe, expect, it } from "vitest";

import { planState } from "./plan";

const now = new Date("2026-09-06T10:00:00+05:00");

describe("planState", () => {
  it("counts the days a premium has left", () => {
    const s = planState("premium", "2026-09-30T00:00:00+05:00", now);
    expect(s.daysLeft).toBe(24);
    expect(s.endingSoon).toBe(false);
  });

  it("flags the last two weeks", () => {
    expect(
      planState("premium", "2026-09-10T00:00:00+05:00", now).endingSoon,
    ).toBe(true);
  });

  it("does not count down a premium with no end", () => {
    expect(planState("premium", undefined, now)).toEqual({
      tier: "premium",
      endingSoon: false,
    });
  });

  it("has nothing to say about free", () => {
    expect(planState("free", "2099-01-01", now)).toEqual({
      tier: "free",
      endingSoon: false,
    });
  });
});
