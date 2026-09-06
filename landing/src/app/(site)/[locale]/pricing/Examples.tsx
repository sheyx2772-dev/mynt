import { getTranslations } from "next-intl/server";

import { money } from "@/lib/devices";
import {
  type RarityTier,
  digitRarity,
  letterRarity,
  parseHandle,
  priceForHandle,
  rarityTier,
} from "@/lib/pricing";

// Five numbers, one per tier, priced by the same function the checkout uses.
//
// A ladder rather than a sample: the point a reader takes from this table is
// how steeply the price moves, and five rows a hundred-fold apart say that
// better than any sentence above them. They are chosen so each lands in a
// different tier — the tier column is computed, not asserted, so if the
// boundaries move the table stops lining up and somebody notices.
const EXAMPLES = ["BCD482", "ABA482", "OSH482", "AAA123", "VIP777"];

const TIER_NAME: Record<RarityTier, string> = {
  common: "tierCommon",
  rare: "tierRare",
  epic: "tierEpic",
  legendary: "tierLegendary",
  genesis: "tierGenesis",
};

const TIER_NOTE: Record<RarityTier, string> = {
  common: "tierCommonNote",
  rare: "tierRareNote",
  epic: "tierEpicNote",
  legendary: "tierLegendaryNote",
  genesis: "tierGenesisNote",
};

export default async function Examples() {
  const t = await getTranslations("pricingPage");
  const r = await getTranslations("rarity");

  const rows = EXAMPLES.flatMap((handle) => {
    const parsed = parseHandle(handle);
    // Unreachable with the list above, and cheap insurance: a combination that
    // became blocked would drop out of the table rather than be advertised.
    if (!parsed) return [];

    const letters = letterRarity(parsed.letters);
    const digits = digitRarity(parsed.digits);

    return [
      {
        handle,
        letters: r(`letters${letters.multiplier}`),
        digits: r(`digits${digits.multiplier}`),
        multiplier: letters.multiplier * digits.multiplier,
        tier: rarityTier(parsed.letters, parsed.digits),
        price: priceForHandle(parsed.letters, parsed.digits),
      },
    ];
  });

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
        {t("tiersTitle")}
      </h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
        {t("tiersBody")}
      </p>

      <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(TIER_NAME) as RarityTier[]).map((tier) => (
          <div key={tier}>
            <dt className="text-sm font-semibold">{t(TIER_NAME[tier])}</dt>
            <dd className="mt-1 text-sm leading-snug text-ink-3">
              {t(TIER_NOTE[tier])}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-14 text-xl font-semibold">{t("examplesTitle")}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
        {t("examplesBody")}
      </p>

      {/* Five columns do not fit a phone, and the fix is a scroller of its
          own rather than a page that drifts sideways under the header. */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-3">
              <th scope="col" className="cap py-2 font-normal">
                {t("colHandle")}
              </th>
              <th scope="col" className="cap py-2 font-normal">
                {t("colPattern")}
              </th>
              <th scope="col" className="cap py-2 font-normal">
                {t("colTier")}
              </th>
              <th scope="col" className="cap py-2 text-right font-normal">
                {t("colTimes")}
              </th>
              <th scope="col" className="cap py-2 text-right font-normal">
                {t("colPrice")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.handle}
                className="border-b border-line-soft last:border-0"
              >
                <th
                  scope="row"
                  className="py-3 pr-4 font-mono font-semibold tracking-[0.14em]"
                >
                  {row.handle}
                </th>
                <td className="py-3 pr-4 text-ink-2">
                  {row.letters} · {row.digits}
                </td>
                <td className="py-3 pr-4">{t(TIER_NAME[row.tier])}</td>
                <td className="py-3 pr-4 text-right font-mono text-ink-2">
                  ×{row.multiplier}
                </td>
                <td className="py-3 text-right font-mono font-semibold whitespace-nowrap">
                  {money(row.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
