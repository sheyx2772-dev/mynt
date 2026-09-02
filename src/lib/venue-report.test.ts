import { describe, expect, it } from "vitest";

import { formatWait, summariseRequests, type ReportRow } from "./venue-report";

function row(over: Partial<ReportRow> = {}): ReportRow {
  return {
    point: "7",
    kind: "waiter",
    rating: null,
    status: "done",
    createdAt: "2026-09-01T12:00:00Z",
    doneAt: "2026-09-01T12:02:00Z",
    ...over,
  };
}

describe("summariseRequests", () => {
  it("counts nothing without pretending to know anything", () => {
    const report = summariseRequests([]);
    expect(report.total).toBe(0);
    expect(report.medianWait).toBeNull();
    expect(report.reviews.average).toBeNull();
    expect(report.points).toEqual([]);
  });

  it("reports the median wait, not the mean", () => {
    // Four tables answered in two minutes and one forgotten until the morning.
    // The mean would be over two hours and the owner would stop believing it.
    const rows = [
      row(),
      row(),
      row(),
      row(),
      row({ doneAt: "2026-09-02T08:00:00Z" }),
    ];

    const report = summariseRequests(rows);
    expect(report.medianWait).toBe(120);
    expect(report.worstWait).toBe(72000);
    expect(report.answered).toBe(5);
  });

  it("ignores a request nobody has closed yet", () => {
    const report = summariseRequests([
      row(),
      row({ status: "new", doneAt: null }),
    ]);
    expect(report.answered).toBe(1);
    expect(report.waiting).toBe(1);
  });

  it("refuses a wait that runs backwards", () => {
    // A clock correction, or a row edited by hand. Better absent than negative.
    const report = summariseRequests([row({ doneAt: "2026-09-01T11:00:00Z" })]);
    expect(report.answered).toBe(0);
    expect(report.medianWait).toBeNull();
  });

  it("ranks the tables that call most", () => {
    const report = summariseRequests([
      row({ point: "3" }),
      row({ point: "7" }),
      row({ point: "7" }),
      row({ point: null }),
    ]);

    expect(report.points).toEqual([
      { point: "7", count: 2 },
      { point: "—", count: 1 },
      { point: "3", count: 1 },
    ]);
  });

  it("puts the hour on the owner's clock, not on UTC", () => {
    // 20:30 in Tashkent is 15:30 the same day in UTC. An owner reading "the
    // three o'clock rush" about their dinner service would trust nothing else
    // on the page.
    const report = summariseRequests([row({ createdAt: "2026-09-01T15:30:00Z" })]);
    expect(report.byHour[20]).toBe(1);
    expect(report.byHour[15]).toBe(0);
  });

  it("averages only the reviews that carried a rating", () => {
    const report = summariseRequests([
      row({ kind: "review", rating: 5 }),
      row({ kind: "review", rating: 4 }),
      row({ kind: "review", rating: null }),
      row({ kind: "waiter" }),
    ]);

    expect(report.reviews).toEqual({ count: 2, average: 4.5 });
    expect(report.byKind.review).toBe(3);
    expect(report.byKind.waiter).toBe(1);
  });
});

describe("formatWait", () => {
  it("reads at a glance rather than to the second", () => {
    expect(formatWait(null)).toBe("—");
    expect(formatWait(45)).toBe("45 soniya");
    expect(formatWait(120)).toBe("2 daqiqa");
    expect(formatWait(3600)).toBe("1 soat");
    expect(formatWait(4320)).toBe("1 soat 12 daqiqa");
  });
});
