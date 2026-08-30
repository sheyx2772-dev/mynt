import { describe, it, expect } from "vitest";
import { timeAgo } from "./relative-time";

const NOW = Date.parse("2026-08-31T12:00:00Z");
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();

describe("timeAgo", () => {
  it("calls anything under a minute 'hozir'", () => {
    expect(timeAgo(ago(0), NOW)).toBe("hozir");
    expect(timeAgo(ago(59), NOW)).toBe("hozir");
  });

  it("counts minutes, hours, days and weeks", () => {
    expect(timeAgo(ago(60), NOW)).toBe("1 daqiqa oldin");
    expect(timeAgo(ago(45 * 60), NOW)).toBe("45 daqiqa oldin");
    expect(timeAgo(ago(3 * 3600), NOW)).toBe("3 soat oldin");
    expect(timeAgo(ago(2 * 86_400), NOW)).toBe("2 kun oldin");
    expect(timeAgo(ago(3 * 604_800), NOW)).toBe("3 hafta oldin");
  });

  // Past a month a relative count stops being informative.
  it("falls back to a date beyond a month", () => {
    expect(timeAgo(ago(60 * 86_400), NOW)).toBe("2026-07-02");
  });

  it("returns null for missing or unparseable input", () => {
    expect(timeAgo(null, NOW)).toBeNull();
    expect(timeAgo("not a date", NOW)).toBeNull();
  });
});
