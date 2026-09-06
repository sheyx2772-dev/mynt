import { getTranslations } from "next-intl/server";

import { money } from "@/lib/devices";
import {
  BASE_PRICE,
  RARE_WORDS,
  TOP_WORDS,
  digitRarity,
  letterRarity,
} from "@/lib/pricing";

// The rule, rendered rather than retold.
//
// Every multiplier, count and price on this page is read out of `lib/pricing`
// while the page renders. Typing the ladder into the copy instead would give a
// page that keeps quoting last quarter's rule after somebody edits it, and a
// buyer who finds out at checkout — which is the one place a price may not
// change.
//
// The example combinations are the only thing chosen by hand: one per branch
// of `letterRarity` and `digitRarity`, so a reader can find the row their own
// number sits on. None of them is on the blocked list.
const LETTER_EXAMPLES = ["VIP", "AAA", "OSH", "ABA", "BCD"];
const DIGIT_EXAMPLES = ["777", "007", "123", "121", "482"];

export default async function RarityTables() {
  const t = await getTranslations("pricingPage");
  // The pattern names already exist, because the answer under the check field
  // on the entry page names them. Two names for one pattern is how a visitor
  // ends up unsure whether they are reading about the same thing.
  const r = await getTranslations("rarity");

  const rows = [
    {
      key: "letters",
      title: t("lettersTitle"),
      body: t("lettersBody", {
        rare: new Set(RARE_WORDS).size,
        top: TOP_WORDS.length,
      }),
      examples: LETTER_EXAMPLES.map((example) => ({
        example,
        ...letterRarity(example),
      })),
      name: (multiplier: number) => r(`letters${multiplier}`),
    },
    {
      key: "digits",
      title: t("digitsTitle"),
      body: t("digitsBody"),
      examples: DIGIT_EXAMPLES.map((example) => ({
        example,
        ...digitRarity(example),
      })),
      name: (multiplier: number) => r(`digits${multiplier}`),
    },
  ];

  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("ruleEyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("ruleTitle")}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
          {t("ruleBody")}
        </p>

        <div className="mt-8 rounded-tile border border-line bg-paper p-6 sm:p-8">
          <p className="cap text-ink-3">{t("baseLabel")}</p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold tracking-[0.04em]">
              {money(BASE_PRICE)}
            </span>
            <span className="text-[13px] text-ink-3">{t("soum")}</span>
          </p>
          <p className="mt-4 border-t border-line pt-4 text-sm text-ink-2">
            {t("formula")}
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-8">
          {rows.map((group) => (
            <div key={group.key}>
              <h3 className="text-xl font-semibold">{group.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                {group.body}
              </p>

              {/* Its own scroller, not the page's. A table that pushes the
                  document sideways takes every other section with it. */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[19rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-ink-3">
                      <th scope="col" className="cap py-2 font-normal">
                        {t("colPattern")}
                      </th>
                      <th scope="col" className="cap py-2 font-normal">
                        {t("colExample")}
                      </th>
                      <th
                        scope="col"
                        className="cap py-2 text-right font-normal"
                      >
                        {t("colTimes")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.examples.map((row) => (
                      <tr
                        key={row.example}
                        className="border-b border-line-soft last:border-0"
                      >
                        <td className="py-3 pr-4">
                          {group.name(row.multiplier)}
                        </td>
                        <td className="py-3 pr-4 font-mono tracking-[0.14em]">
                          {row.example}
                        </td>
                        <td className="py-3 text-right font-mono font-semibold">
                          ×{row.multiplier}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
