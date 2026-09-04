import { describe, it, expect } from "vitest";
import { formatNumber, formatUZS } from "./format";

describe("formatNumber", () => {
  it("groups thousands with a space", () => {
    expect(formatNumber(99000)).toBe("99 000");
    expect(formatNumber(1188000)).toBe("1 188 000");
    expect(formatNumber(118800000)).toBe("118 800 000");
  });

  it("leaves short numbers alone", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });

  it("rounds rather than printing decimals", () => {
    expect(formatNumber(1000.4)).toBe("1 000");
    expect(formatNumber(1000.6)).toBe("1 001");
  });
});

describe("formatUZS", () => {
  it("appends the currency", () => {
    expect(formatUZS(99000)).toBe("99 000 so'm");
  });
});
