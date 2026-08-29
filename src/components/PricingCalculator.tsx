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
    <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-[0_1px_0_rgba(14,10,27,0.04)]">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex overflow-hidden rounded-lg border border-black/10 font-display text-2xl font-semibold tracking-tight">
          <input
            aria-label="Harflar"
            value={letters}
            onChange={(e) => setLetters(e.target.value.slice(0, 3))}
            maxLength={3}
            className="w-20 bg-transparent px-3 py-2 text-center uppercase outline-none"
          />
          <div className="w-px bg-black/10" />
          <input
            aria-label="Raqamlar"
            value={digits}
            onChange={(e) => setDigits(e.target.value.slice(0, 3))}
            maxLength={3}
            className="font-tabular w-20 bg-transparent px-3 py-2 text-center outline-none"
          />
        </div>
        <span className="text-black/40 text-sm">mynt.uz/{cleanLetters}{cleanDigits}</span>
      </div>

      <div className="space-y-3 font-tabular text-sm">
        <div className="flex items-center justify-between py-2 border-b border-black/5">
          <div>
            <div className="font-medium">Bazaviy narx</div>
          </div>
          <div>{formatUZS(BASE_PRICE)}</div>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-black/5">
          <div>
            <div className="font-medium">Harf kamyobligi &times;{letterMult}</div>
            <div className="text-black/40 text-xs font-sans">{letterReason}</div>
          </div>
          <div>&times;{letterMult}</div>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-black/5">
          <div>
            <div className="font-medium">Raqam kamyobligi &times;{digitMult}</div>
            <div className="text-black/40 text-xs font-sans">{digitReason}</div>
          </div>
          <div>&times;{digitMult}</div>
        </div>
        <div className="flex items-center justify-between pt-3">
          <div className="font-display text-lg font-semibold">Jami narx</div>
          <div className="rounded-md bg-lime px-3 py-1.5 font-display text-lg font-semibold text-mynt-black">
            {formatUZS(total)}
          </div>
        </div>
      </div>
    </div>
  );
}
