import { describe, it, expect } from "vitest";
import { bandFor, venueMonthly, perPointMonthly, isVertical, MAX_POINTS } from "./venues";

describe("venue bands", () => {
  it("prices the small band up to and including 15 points", () => {
    expect(venueMonthly(1)).toBe(149_000);
    expect(venueMonthly(15)).toBe(149_000);
  });

  it("moves to the middle band at 16", () => {
    expect(venueMonthly(16)).toBe(299_000);
    expect(venueMonthly(40)).toBe(299_000);
  });

  // A chain wants a conversation, not a number off a page.
  it("negotiates above 40", () => {
    expect(venueMonthly(41)).toBeNull();
    expect(venueMonthly(5_000)).toBeNull();
    expect(bandFor(41).monthly).toBeNull();
  });

  // The form and the calculator both accept typing, and neither should be able
  // to produce a division by zero or a negative price.
  it("treats zero, negatives and fractions as one point", () => {
    expect(venueMonthly(0)).toBe(149_000);
    expect(venueMonthly(-4)).toBe(149_000);
    expect(venueMonthly(2.7)).toBe(149_000);
    expect(venueMonthly(Number.NaN)).toBe(149_000);
  });
});

describe("perPointMonthly", () => {
  // The number that makes the band jump visible rather than hiding it.
  it("falls as a venue fills its band", () => {
    expect(perPointMonthly(3)).toBe(49_667);
    expect(perPointMonthly(15)).toBe(9_933);
    expect(perPointMonthly(30)).toBe(9_967);
    expect(perPointMonthly(40)).toBe(7_475);
  });

  it("has no answer in the negotiated band", () => {
    expect(perPointMonthly(100)).toBeNull();
  });
});

describe("isVertical", () => {
  it("accepts the four we sell and nothing else", () => {
    expect(isVertical("cafe")).toBe(true);
    expect(isVertical("hotel")).toBe(true);
    expect(isVertical("shop")).toBe(true);
    expect(isVertical("other")).toBe(true);
    expect(isVertical("auto")).toBe(false);
    expect(isVertical("casino")).toBe(false);
    expect(isVertical(null)).toBe(false);
    expect(isVertical(7)).toBe(false);
  });
});

describe("MAX_POINTS", () => {
  it("matches the database's own guard", () => {
    expect(MAX_POINTS).toBe(100_000);
  });
});
