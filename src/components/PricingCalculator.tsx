"use client";

import { useMemo, useState } from "react";
import { formatUZS } from "@/lib/format";

const BASE_PRICE = 99_000;
const RARE_WORDS = ["VIP", "CEO", "GOD", "SIR", "ACE", "WOW", "TOP", "BOSS".slice(0, 3)];

function letterRarity(letters: string): { multiplier: number; reason: string } {
  const l = letters.toUpperCase().split("");
  if (l[0] === l[1] && l[1] === l[2]) {
    return { multiplier: 30, reason: "3 ta bir xil harf (masalan AAA)" };
  }
  if (RARE_WORDS.includes(letters.toUpperCase())) {
    return { multiplier: 20, reason: "tanish/qisqa so'z (masalan VIP)" };
  }
  if (l[0] === l[2]) {
    return { multiplier: 4, reason: "palindrom shakl (masalan ABA)" };
  }
  return { multiplier: 1, reason: "oddiy kombinatsiya" };
}

function digitRarity(digits: string): { multiplier: number; reason: string } {
  const d = digits.split("").map(Number);
  if (d[0] === d[1] && d[1] === d[2]) {
    return { multiplier: 40, reason: "3 ta bir xil raqam (masalan 000, 777)" };
  }
  if (d[0] === 0 && d[1] === 0) {
    return { multiplier: 15, reason: "boshida ikkita nol (00X)" };
  }
  const asc = d[1] === d[0] + 1 && d[2] === d[1] + 1;
  const desc = d[1] === d[0] - 1 && d[2] === d[1] - 1;
  if (asc || desc) {
    return { multiplier: 12, reason: "ketma-ket raqamlar (masalan 123)" };
  }
  if (d[0] === d[2]) {
    return { multiplier: 5, reason: "palindrom raqam (masalan 121)" };
  }
  return { multiplier: 1, reason: "oddiy raqam" };
}

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
