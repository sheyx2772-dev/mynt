// Numbers and dates, the way the cabinet prints them.
//
// One place, because the owner reads the same figure on three screens and a
// count that is "1 234" on one and "1,234" on another reads as two numbers.

/** A count, grouped with thin spaces the way prices already are. */
export function count(n: number): string {
  return n.toLocaleString("ru-RU").replace(/\s/g, " ");
}

/** A date in the reader's language, Tashkent time. */
export function day(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Tashkent",
  });
}

/** `2026-09-04` → `04.09`, for the axis of a chart. */
export function shortDay(iso: string): string {
  const [, month, d] = iso.split("-");
  return `${d}.${month}`;
}

/** Two letters for a face that has no picture. */
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}
