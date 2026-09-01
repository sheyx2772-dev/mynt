import type { Lang } from "@/lib/i18n";

// "5 daqiqa oldin" style stamps. Kept small and dependency-free;
// Intl.RelativeTimeFormat has no Uzbek data in every runtime we render in.
//
// Russian is here because half of it appearing on a Russian profile is worse
// than none of it: "Был в сети — 6 soat oldin" reads as a page that was
// translated by somebody who gave up halfway.

type Unit = {
  limit: number;
  uz: string;
  ru: [one: string, few: string, many: string];
  en: string;
};

// Russian counts in three forms — 1 час, 2 часа, 5 часов — and picking the
// wrong one is the tell of a machine translation.
const UNITS: Unit[] = [
  { limit: 60, en: "second", uz: "soniya", ru: ["секунду", "секунды", "секунд"] },
  { limit: 3600, en: "minute", uz: "daqiqa", ru: ["минуту", "минуты", "минут"] },
  { limit: 86_400, en: "hour", uz: "soat", ru: ["час", "часа", "часов"] },
  { limit: 604_800, en: "day", uz: "kun", ru: ["день", "дня", "дней"] },
  { limit: 2_592_000, en: "week", uz: "hafta", ru: ["неделю", "недели", "недель"] },
];

function plural(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function timeAgo(iso: string | null, lang: Lang = "uz", now = Date.now()): string | null {
  if (!iso) return null;

  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) {
    if (lang === "ru") return "только что";
    if (lang === "en") return "just now";
    return "hozir";
  }

  let previous = 1;
  for (const unit of UNITS) {
    if (seconds < unit.limit) {
      const count = Math.floor(seconds / previous);
      if (lang === "ru") return `${count} ${plural(count, unit.ru)} назад`;
      if (lang === "en") return `${count} ${unit.en}${count === 1 ? "" : "s"} ago`;
      return `${count} ${unit.uz} oldin`;
    }
    previous = unit.limit;
  }

  // Older than a month: a date is more useful than a count of weeks.
  return new Date(then).toISOString().slice(0, 10);
}
