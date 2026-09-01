export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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

export function formatUZS(n: number, lang = "uz"): string {
  return `${formatNumber(n)} ${CURRENCY[lang] ?? CURRENCY.uz}`;
}
