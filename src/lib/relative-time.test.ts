import { describe, it, expect } from "vitest";
import { timeAgo } from "./relative-time";

const NOW = Date.parse("2026-08-31T12:00:00Z");
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();

describe("timeAgo", () => {
  it("calls anything under a minute 'hozir'", () => {
    expect(timeAgo(ago(0), "uz", NOW)).toBe("hozir");
    expect(timeAgo(ago(59), "uz", NOW)).toBe("hozir");
  });

  it("counts minutes, hours, days and weeks", () => {
    expect(timeAgo(ago(60), "uz", NOW)).toBe("1 daqiqa oldin");
    expect(timeAgo(ago(45 * 60), "uz", NOW)).toBe("45 daqiqa oldin");
    expect(timeAgo(ago(3 * 3600), "uz", NOW)).toBe("3 soat oldin");
    expect(timeAgo(ago(2 * 86_400), "uz", NOW)).toBe("2 kun oldin");
    expect(timeAgo(ago(3 * 604_800), "uz", NOW)).toBe("3 hafta oldin");
  });

  // Past a month a relative count stops being informative.
  it("falls back to a date beyond a month", () => {
    expect(timeAgo(ago(60 * 86_400), "uz", NOW)).toBe("2026-07-02");
  });

  it("returns null for missing or unparseable input", () => {
    expect(timeAgo(null, "uz", NOW)).toBeNull();
    expect(timeAgo("not a date", "uz", NOW)).toBeNull();
  });
});

describe("timeAgo in Russian", () => {
  const now = Date.parse("2026-09-02T12:00:00Z");
  const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

  // Getting these wrong is the tell of a machine translation.
  it("picks the right one of Russian's three plural forms", () => {
    expect(timeAgo(ago(3600), "ru", now)).toBe("1 час назад");
    expect(timeAgo(ago(3600 * 2), "ru", now)).toBe("2 часа назад");
    expect(timeAgo(ago(3600 * 5), "ru", now)).toBe("5 часов назад");
    expect(timeAgo(ago(3600 * 11), "ru", now)).toBe("11 часов назад");
    expect(timeAgo(ago(3600 * 21), "ru", now)).toBe("21 час назад");
  });

  it("says just now under a minute", () => {
    expect(timeAgo(ago(30), "ru", now)).toBe("только что");
  });

  it("leaves Uzbek alone", () => {
    expect(timeAgo(ago(3600 * 2), "uz", now)).toBe("2 soat oldin");
  });
});
