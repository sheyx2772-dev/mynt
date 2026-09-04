// Turning a buyer's sentence into a card design.
//
// Every design in the catalogue so far was produced by writing the same
// paragraph by hand and changing one clause. That paragraph is the product:
// the buyer says what they want, this builds the instruction, and the picture
// comes back ready to print. What the buyer never has to know is the part that
// makes it printable — the card's proportions, the corner the contactless mark
// occupies, and the quarter that has to stay empty because their handle is
// printed over it.

/** Aspect ratio of a bank card, which is what a Flex card is cut to. */
export const CARD_RATIO = "1.586:1";

export type WishVerdict = { ok: true } | { ok: false; reason: string };

// A design is manufactured and sold, so two things cannot go on it whatever a
// buyer asks for: a state symbol, whose use is set out in law and does not
// extend to merchandise, and someone else's mark, which is an infringement the
// moment the card is sold rather than when it is drawn.
//
// This list is a first filter and is not claimed to be complete — no word list
// can be. The instruction sent to the generator repeats the same limits, and a
// design still passes a human eye before it is printed. What the list does buy
// is a clear, immediate answer to the buyer instead of a picture that has to be
// rejected later.
const STATE_SYMBOLS = [
  "gerb",
  "герб",
  "coat of arms",
  "state emblem",
  "davlat ramzi",
  "davlat gerbi",
  "bayroq",
  "байрок",
  "флаг",
  "flag",
  "emblem",
  "gosudarstvenn",
];

const OTHERS_MARKS = [
  "logo",
  "логотип",
  "brend",
  "бренд",
  "brand",
  "trademark",
  "tovar belgisi",
];

function normalise(wish: string): string {
  return wish.toLowerCase().replace(/[’'`]/g, "").replace(/\s+/g, " ").trim();
}

function contains(haystack: string, needles: string[]): string | null {
  return needles.find((n) => haystack.includes(n)) ?? null;
}

export function screenWish(wish: string): WishVerdict {
  const text = normalise(wish);

  if (text.length < 3) {
    return { ok: false, reason: "Nima xohlayotganingizni birozroq yozing." };
  }
  if (text.length > 400) {
    return { ok: false, reason: "Tavsif juda uzun — 400 belgigacha qisqartiring." };
  }

  const symbol = contains(text, STATE_SYMBOLS);
  if (symbol) {
    return {
      ok: false,
      reason:
        "Davlat gerbi va bayrog'i qonun bilan tartibga solingan — sotiladigan kartaga bosilmaydi. " +
        "O'rniga Humo qushi, paxta-bug'doy gulchambari, naqsh yoki O'zbekiston xaritasini so'rang.",
    };
  }

  const mark = contains(text, OTHERS_MARKS);
  if (mark) {
    return {
      ok: false,
      reason:
        "Boshqa firmaning belgisi yoki logotipini kartaga bosib bo'lmaydi. " +
        "Uslubni tasvirlab bering — masalan «avtosport uslubi», «minimal qora» — natija sizniki bo'ladi.",
    };
  }

  return { ok: true };
}

// The clauses below are the ones that were arrived at by generating designs and
// looking at what came back wrong: cards drawn at the wrong proportions, art
// that filled the corner the handle goes in, two contactless marks in one
// corner, and hairlines a press cannot hold.
const RULES = [
  `Aspect ratio exactly ${CARD_RATIO}, the proportions of a bank card.`,
  "The card fills the whole image, seen straight on with no perspective, no mockup, no hand and no background scene.",
  "Keep the lower-left quarter calm and free of busy detail or bright colour — a handle code and a web address are printed over it later, so nothing may compete there.",
  "Put a small contactless payment symbol in the top-right corner.",
  "Put no text, letters, numbers or logos anywhere in the artwork.",
  "Do not reproduce any national emblem, coat of arms, flag or state insignia of any country, and do not reproduce any company's trademark, logo or brand.",
  "Keep every line at least 0.3 mm thick at 85 mm wide so it survives printing, and avoid neon colours that cannot be reproduced in CMYK.",
];

export function buildDesignPrompt(wish: string): string {
  return [
    "Create flat front-face artwork for an NFC business card.",
    RULES[1],
    RULES[0],
    `Design: ${wish.trim().replace(/\s+/g, " ")}.`,
    ...RULES.slice(2),
  ].join(" ");
}
