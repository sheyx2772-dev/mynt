"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Shuffle, ArrowRight } from "lucide-react";
import { formatUZS, formatNumber } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { BASE_PRICE, letterRarity, digitRarity, rarityTier } from "@/lib/pricing";

// What each band looks like. Kept here rather than in the dictionary because a
// colour is not a translation, and the names come from the dictionary anyway.
const TIER_STYLE: Record<string, string> = {
  common: "bg-black/[0.06] text-black/50",
  rare: "bg-sky-100 text-sky-700",
  epic: "bg-violet-100 text-violet-700",
  legendary: "bg-amber-100 text-amber-700",
  genesis: "bg-flex-black text-lime",
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function PricingCalculator({
  labels,
  lang,
}: {
  lang: Lang;
  labels: {
    base: string;
    letterRarity: string;
    digitRarity: string;
    total: string;
    deviceNote: string;
    tiers: Record<string, string>;
    randomise: string;
    /** Carries a {handle} placeholder, filled in with what is being priced. */
    take: string;
    formula: string;
  };
}) {
  const [letters, setLetters] = useState("MYN");
  const [digits, setDigits] = useState("042");

  const cleanLetters = letters.toUpperCase().replace(/[^A-Z]/g, "").padEnd(3, "X").slice(0, 3);
  const cleanDigits = digits.replace(/[^0-9]/g, "").padEnd(3, "0").slice(0, 3);

  // Most people cannot think of a handle on the spot, and an empty box they
  // have to fill is where a price calculator loses them. One button removes
  // that step entirely.
  function randomise() {
    const pick = (n: number, from: string) =>
      Array.from({ length: n }, () => from[Math.floor(Math.random() * from.length)]).join("");
    setLetters(pick(3, LETTERS));
    setDigits(pick(3, "0123456789"));
  }

  const { letterMult, letterReason, digitMult, digitReason, total } = useMemo(() => {
    const lr = letterRarity(cleanLetters);
    const dr = digitRarity(cleanDigits);
    return {
      letterMult: lr.multiplier,
      letterReason: lr.reason,
      digitMult: dr.multiplier,
      digitReason: dr.reason,
      total: BASE_PRICE * lr.multiplier * dr.multiplier,
    };
  }, [cleanLetters, cleanDigits]);

  const tier = rarityTier(cleanLetters, cleanDigits);

  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-lime/10 blur-3xl" />
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)] sm:p-8">
        <div className="mb-7 flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-2xl border-2 border-flex-black/90 font-display text-2xl font-semibold tracking-tight shadow-[0_6px_16px_-8px_rgba(14,10,27,0.4)]">
            <input
              aria-label="Harflar"
              value={letters}
              onChange={(e) => setLetters(e.target.value.slice(0, 3))}
              maxLength={3}
              className="w-24 bg-transparent px-3 py-3 text-center uppercase outline-none"
            />
            <div className="w-px bg-black/10" />
            <input
              aria-label="Raqamlar"
              value={digits}
              onChange={(e) => setDigits(e.target.value.slice(0, 3))}
              maxLength={3}
              className="font-tabular w-24 bg-lime/10 px-3 py-3 text-center outline-none"
            />
          </div>
          <span className="font-tabular text-sm text-black/40">
            flex.com.uz/{cleanLetters}
            {cleanDigits}
          </span>

          <button
            type="button"
            onClick={randomise}
            aria-label={labels.randomise}
            title={labels.randomise}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-flex-black/90 transition-colors hover:bg-black/[0.04]"
          >
            <Shuffle className="h-4 w-4" />
          </button>
        </div>

        {/* The band, named. "×1 oddiy kombinatsiya" is arithmetic; a name is a
            thing worth having, and it is the same information. */}
        <div className="mb-5">
          <span
            className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${TIER_STYLE[tier]}`}
          >
            {labels.tiers[tier]}
          </span>
        </div>

        <div className="space-y-1 font-tabular text-sm">
          <div className="flex items-center justify-between border-b border-black/5 py-3">
            <div className="font-medium">{labels.base}</div>
            <div>{formatUZS(BASE_PRICE, lang)}</div>
          </div>
          <div className="flex items-center justify-between border-b border-black/5 py-3">
            <div>
              <div className="font-medium">{labels.letterRarity}</div>
              <div className="font-sans text-xs text-black/40">{letterReason}</div>
            </div>
            <div className="font-semibold">&times;{letterMult}</div>
          </div>
          <div className="flex items-center justify-between border-b border-black/5 py-3">
            <div>
              <div className="font-medium">{labels.digitRarity}</div>
              <div className="font-sans text-xs text-black/40">{digitReason}</div>
            </div>
            <div className="font-semibold">&times;{digitMult}</div>
          </div>
          <div className="flex items-center justify-between pt-5">
            <div className="font-display text-lg font-semibold">{labels.total}</div>
            <div className="rounded-xl bg-lime px-4 py-2 font-display text-xl font-semibold text-flex-black">
              {formatUZS(total, lang)}
            </div>
          </div>

          {/* The arithmetic written out. The rows above say what each factor is;
              this says the sum is not something we made up. */}
          <p className="pt-2 text-xs text-black/35">
            {labels.formula}: {formatNumber(BASE_PRICE)} × {letterMult} × {digitMult} ={" "}
            {formatUZS(total, lang)}
          </p>

          {/* The calculator was a table. Somebody who has just been shown a
              price and a name for what they are looking at is the likeliest
              buyer on the page, and there was nothing here for them to press. */}
          <Link
            href={`/${cleanLetters}${cleanDigits}`}
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-flex-black px-6 py-4 font-medium text-white transition-transform hover:scale-[1.01]"
          >
            {labels.take.replace("{handle}", `${cleanLetters}${cleanDigits}`)}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="pt-3 font-sans text-xs leading-relaxed text-black/40">
            {labels.deviceNote}
          </p>
        </div>
      </div>
    </div>
  );
}
