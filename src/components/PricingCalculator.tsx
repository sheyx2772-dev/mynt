"use client";

import { useMemo, useState } from "react";
import { formatUZS } from "@/lib/format";
import { BASE_PRICE, letterRarity, digitRarity } from "@/lib/pricing";

export default function PricingCalculator() {
  const [letters, setLetters] = useState("MYN");
  const [digits, setDigits] = useState("042");

  const cleanLetters = letters.toUpperCase().replace(/[^A-Z]/g, "").padEnd(3, "X").slice(0, 3);
  const cleanDigits = digits.replace(/[^0-9]/g, "").padEnd(3, "0").slice(0, 3);

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

  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-lime/10 blur-3xl" />
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)] sm:p-8">
        <div className="mb-7 flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-2xl border-2 border-mynt-black/90 font-display text-2xl font-semibold tracking-tight shadow-[0_6px_16px_-8px_rgba(14,10,27,0.4)]">
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
            mynt.uz/{cleanLetters}
            {cleanDigits}
          </span>
        </div>

        <div className="space-y-1 font-tabular text-sm">
          <div className="flex items-center justify-between border-b border-black/5 py-3">
            <div className="font-medium">Bazaviy narx</div>
            <div>{formatUZS(BASE_PRICE)}</div>
          </div>
          <div className="flex items-center justify-between border-b border-black/5 py-3">
            <div>
              <div className="font-medium">Harf kamyobligi</div>
              <div className="font-sans text-xs text-black/40">{letterReason}</div>
            </div>
            <div className="font-semibold">&times;{letterMult}</div>
          </div>
          <div className="flex items-center justify-between border-b border-black/5 py-3">
            <div>
              <div className="font-medium">Raqam kamyobligi</div>
              <div className="font-sans text-xs text-black/40">{digitReason}</div>
            </div>
            <div className="font-semibold">&times;{digitMult}</div>
          </div>
          <div className="flex items-center justify-between pt-5">
            <div className="font-display text-lg font-semibold">Jami narx</div>
            <div className="rounded-xl bg-lime px-4 py-2 font-display text-xl font-semibold text-mynt-black shadow-[0_10px_24px_-8px_rgba(171,255,9,0.7)]">
              {formatUZS(total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
