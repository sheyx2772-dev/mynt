// "5 daqiqa oldin" style stamps, in Uzbek. Kept small and dependency-free;
// Intl.RelativeTimeFormat has no Uzbek data in every runtime we render in.
const UNITS: [seconds: number, one: string, many: string][] = [
  [60, "soniya", "soniya"],
  [3600, "daqiqa", "daqiqa"],
  [86_400, "soat", "soat"],
  [604_800, "kun", "kun"],
  [2_592_000, "hafta", "hafta"],
];

export function timeAgo(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;

  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "hozir";

  let previous = 1;
  for (const [limit, , label] of UNITS) {
    if (seconds < limit) {
      return `${Math.floor(seconds / previous)} ${label} oldin`;
    }
    previous = limit;
  }

  // Older than a month: a date is more useful than a count of weeks.
  return new Date(then).toISOString().slice(0, 10);
}
