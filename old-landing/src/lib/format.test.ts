import { describe, it, expect } from "vitest";
import { formatNumber, formatUZS } from "./format";

describe("formatNumber", () => {
  it("groups thousands with a space", () => {
    expect(formatNumber(99000)).toBe("99\u00a0000");
    expect(formatNumber(1188000)).toBe("1\u00a0188\u00a0000");
    expect(formatNumber(118800000)).toBe("118\u00a0800\u00a0000");
  });

  // The separator has to be one the browser will not break a line at. A price
  // split across two lines is a price somebody misreads.
  it("uses a non-breaking space, not an ordinary one", () => {
    expect(formatNumber(99000)).not.toContain(" ");
  });

  it("leaves short numbers alone", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });

  it("rounds rather than printing decimals", () => {
    expect(formatNumber(1000.4)).toBe("1\u00a0000");
    expect(formatNumber(1000.6)).toBe("1\u00a0001");
  });
});

describe("formatUZS", () => {
  it("appends the currency", () => {
    expect(formatUZS(99000)).toBe("99\u00a0000\u00a0so'm");
  });
});
