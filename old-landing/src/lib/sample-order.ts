/**
 * The order the entry page's sample shelf is read in.
 *
 * A shelf is judged by its first two tiles — nobody scrolls twenty-one of
 * anything to find out whether the design is good — so the strongest go at the
 * head and the shelf is arranged to keep changing as it moves.
 *
 * Ranked by looking at all twenty-one rendered at the same size, not from the
 * file order, which was the order they happened to be written in.
 *
 * The layouts lead, because each one is a different design; the organisation
 * cards are all one template wearing a different brand, so a row of them at
 * the head would look like one card repeating.
 */

/**
 * By name, and in this order because:
 *  - Zarbof is the only one with a typographic identity of its own — black,
 *    gold serif, the portrait in a ring. It is the best thing on the shelf.
 *  - Ko'k is the template the client's own folder leads with, and the
 *    brightest thing here. Second because five of the seven are dark and two
 *    black tiles in the opening pair make the shelf look like one tile.
 *  - Ijtimoiy is the only one carrying full-colour brand marks, so it reads
 *    as a different kind of page rather than a recolour of the last one — and
 *    it keeps two NFC variants out of the second and third slots.
 *  - Tungi is the most striking of the three NFC variants: orange on black.
 *  - Plakat is white and enormous — the sharpest break in the row.
 *  - Yashil and Kvitansiya are the quietest, and last.
 *
 * No two adjacent tiles are the same template, and the opening three alternate
 * dark, bright, dark. Further down they cannot: most of the seven are dark
 * grounds, and strength wins over alternation.
 */
export const LAYOUT_ORDER = [
  "Zarbof",
  "NFC vizitka — ko'k",
  "Ijtimoiy",
  "NFC vizitka — tungi",
  "Plakat",
  "NFC vizitka — yashil",
  "Kvitansiya",
];

/**
 * By id. The organisations are one template, so what separates them is the
 * banner: the nine that carry their own logo come first, and the five drawing
 * a bare brand gradient — because the logo on file belongs to another body —
 * come last, where an empty banner costs least.
 */
export const ORG_ORDER = [
  "itpark",
  "yoshlar-agentligi",
  "uzv-fund",
  "nbu",
  "uzfar",
  "iqtisodiyot",
  "uzreport",
  "raqamli",
  "chamber",
  // The five with no logo of their own yet. The two ATKRV cards are split
  // across the list on purpose — side by side they read as a duplicate.
  "moliya",
  "hokimiyat",
  "agrobank",
  "kapitalbank",
  "tashkent-inn",
];

/**
 * Sorts by position in `order`. Anything not listed keeps its original
 * position relative to the others and goes to the end rather than vanishing —
 * a new layout or organisation should show up on the shelf unranked, not
 * disappear from it because someone forgot to add a line here.
 */
export function bySampleOrder<T>(
  items: readonly T[],
  key: (item: T) => string,
  order: readonly string[],
): T[] {
  const rank = (item: T) => {
    const i = order.indexOf(key(item));
    return i === -1 ? order.length : i;
  };
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank(a.item) - rank(b.item) || a.i - b.i)
    .map((e) => e.item);
}
