import type { RequestKind, VenueRequest } from "@/lib/venue-requests";

// What last month looked like.
//
// The counter screen answers "what is waiting"; this answers "how did we do",
// which is the question an owner asks once a week and the one the business page
// has been promising since it was written. Everything here comes from rows the
// requests already store — the point they came from, when they arrived, and
// when somebody closed them. done_at exists for exactly this.
//
// Kept as a pure function over rows because the interesting part is the
// arithmetic, and arithmetic that decides what a cafe believes about its own
// service should be tested rather than eyeballed.

export type ReportRow = Pick<VenueRequest, "point" | "kind" | "rating" | "status" | "createdAt"> & {
  /** When somebody marked it done, if they have. */
  doneAt: string | null;
};

export type PointCount = { point: string; count: number };

export type VenueReport = {
  total: number;
  byKind: Record<RequestKind, number>;
  /** Still open right now. */
  waiting: number;

  /**
   * How long a table waited, in seconds.
   *
   * The median rather than the mean: one request closed the next morning
   * because nobody pressed the button turns a good week into a bad average,
   * and the owner would rightly stop believing the number. The worst is
   * reported beside it, since that one is worth knowing too.
   */
  medianWait: number | null;
  worstWait: number | null;
  answered: number;

  /** Busiest points first. */
  points: PointCount[];
  /** Requests by hour of the local day, 0–23. */
  byHour: number[];

  reviews: { count: number; average: number | null };
};

const EMPTY_KINDS: Record<RequestKind, number> = {
  waiter: 0,
  bill: 0,
  clean: 0,
  review: 0,
  other: 0,
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1]! + sorted[middle]!) / 2)
    : sorted[middle]!;
}

export function summariseRequests(rows: readonly ReportRow[], offsetMinutes = 300): VenueReport {
  const byKind = { ...EMPTY_KINDS };
  const perPoint = new Map<string, number>();
  const byHour = Array.from({ length: 24 }, () => 0);
  const waits: number[] = [];
  const ratings: number[] = [];

  let waiting = 0;

  for (const row of rows) {
    byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;

    if (row.status === "new") waiting += 1;

    const label = row.point ?? "—";
    perPoint.set(label, (perPoint.get(label) ?? 0) + 1);

    // Stored in UTC and read by somebody standing in the room, for whom "the
    // eight o'clock rush" means eight o'clock on their own clock.
    const at = new Date(row.createdAt).getTime() + offsetMinutes * 60_000;
    byHour[new Date(at).getUTCHours()] += 1;

    if (row.doneAt) {
      const seconds = Math.round(
        (new Date(row.doneAt).getTime() - new Date(row.createdAt).getTime()) / 1000,
      );
      // A clock that went backwards, or a row closed in the same second.
      if (seconds >= 0) waits.push(seconds);
    }

    if (row.kind === "review" && row.rating) ratings.push(row.rating);
  }

  const points = [...perPoint.entries()]
    .map(([point, count]) => ({ point, count }))
    .sort((a, b) => b.count - a.count || a.point.localeCompare(b.point));

  return {
    total: rows.length,
    byKind,
    waiting,
    medianWait: median(waits),
    worstWait: waits.length > 0 ? Math.max(...waits) : null,
    answered: waits.length,
    points,
    byHour,
    reviews: {
      count: ratings.length,
      average:
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null,
    },
  };
}

/** "4 daqiqa", "1 soat 12 daqiqa" — read at a glance, not to the second. */
export function formatWait(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} soniya`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} daqiqa`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} soat` : `${hours} soat ${rest} daqiqa`;
}
