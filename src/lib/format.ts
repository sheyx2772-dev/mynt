/**
 * Thousands, grouped the way they are grouped here.
 *
 * A space, not a dot and not a comma: 45 000, never 45.000 or 45,000. And a
 * non-breaking one, because a price that wraps between the 45 and the 000 has
 * been read as forty-five by somebody in a hurry.
 */
export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

/**
 * The currency's own name, which differs by who is reading it.
 *
 * The amount never does — a price is the same number in every language, and
 * only the word after it moves. "сум" is how the currency is written in Russian
 * here; English keeps the Latin spelling rather than the ISO code, because a
 * price tag reads as a price tag and UZS reads as a bank statement.
 */
const CURRENCY: Record<string, string> = {
  uz: "so'm",
  ru: "сум",
  en: "so'm",
};

export function currencyWord(lang = "uz"): string {
  return CURRENCY[lang] ?? CURRENCY.uz;
}

export function formatUZS(n: number, lang = "uz"): string {
  return `${formatNumber(n)}\u00a0${currencyWord(lang)}`;
}

/**
 * A date somebody reads, not one somebody parses.
 *
 * "3-sentabr, 2026" rather than an ISO stamp: these appear next to invoices and
 * expiry dates, where the question is always "which day" and never "which
 * millisecond".
 */
export function formatDate(iso: string, lang = "uz"): string {
  return new Date(iso).toLocaleDateString(lang === "uz" ? "uz-UZ" : lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
