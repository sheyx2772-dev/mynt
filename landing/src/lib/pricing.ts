// A plain combination starts here; the rarity multipliers above take it up
// from there. Round, because a price with a 9 on the end reads as a discount
// and this is not a discounted thing.
export const BASE_PRICE = 100_000;
// The tier is a multiplier of twenty, so every word added here takes a
// combination out of the hundred-thousand pool and puts it in a two-million
// one. It is a pricing decision, not a dictionary — a word belongs here when
// somebody would pay for it, not when it exists.
//
// Three groups. What a person is: the titles somebody puts on a card. Where
// they are: the ones that read as Uzbek rather than as English. And what
// anybody recognises anywhere.
//
// Uzbek words with an apostrophe — o‘, g‘ — cannot be here at all: a handle
// is three letters of A–Z, and "O‘ZB" is four characters of which one is not
// a letter.
// The words somebody pays for because of what they say about them.
//
// A subset of RARE_WORDS, checked first. The shape rules ranked three
// identical letters above a word people know, so QQQ444 cost 120 million and
// VIP777 cost 80 — the formula was reading the pattern and not the meaning. On
// a business card the meaning is the product: VIP says something, QQQ is only
// rare.
export const TOP_WORDS = [
  "VIP",
  "CEO",
  "CTO",
  "CFO",
  "MBA",
  "PRO",
  "BOS",
  "SIR",
  "DOC",
  "LAW",
  "MED",
  "TOP",
  "LUX",
  "MAX",
  "WIN",
  "ONE",
  "KEY",
  "ACE",
  "UZB",
  "GOD",
] as const;

const TOP = new Set<string>(TOP_WORDS);

export const RARE_WORDS = [
  // What a person is, and what they do. The trades sell to a business rather
  // than to one person, which is a different and larger buyer.
  "VIP",
  "CEO",
  "CTO",
  "CFO",
  "MBA",
  "DEV",
  "DOC",
  "PRO",
  "BOS",
  "SIR",
  "BEK",
  "XON",
  "GYM",
  "SPA",
  "LAW",
  "MED",
  "WEB",
  "APP",
  "HUB",
  "LAB",
  "BAR",
  "TAX",
  "PAY",
  "FIT",
  "JOB",
  "CAR",
  "SEO",
  "NET",
  // Uzbek, written the way the alphabet here allows. OSH is the strongest of
  // them: every choyxona in the country wants it.
  "OTA",
  "ONA",
  "AKA",
  "OPA",
  "OYI",
  "JON",
  "DIL",
  "YOR",
  "PUL",
  "NON",
  "OSH",
  "SUV",
  "QOR",
  "KUN",
  "TUN",
  "YOZ",
  "KUZ",
  "TIL",
  "ISH",
  "GAP",
  "BOY",
  "SOZ",
  // Names. Three letters is a short name here, so there are few — but a person
  // buying their own name is the easiest sale there is.
  "ALI",
  "ABU",
  "UMR",
  "MIR",
  // Where they are: the cities, the way an airport writes them.
  "UZB",
  "NUR",
  "ZAR",
  "ASL",
  "TOY",
  "GUL",
  "SAM",
  "BUX",
  "XIV",
  "NAV",
  "AND",
  "FAR",
  // And where they are from. These were nearly blocked, on the reasoning that
  // somebody could put one on a profile written to insult. The argument that
  // settled it is UZB, which has been in this list from the start and sells for
  // millions: it is bought as pride, not as an insult, and there is no version
  // of that argument that holds for one people and not the next.
  "RUS",
  "TAJ",
  "QOZ",
  "QIR",
  "AFG",
  "ARM",
  // What anybody recognises.
  "GOD",
  "ACE",
  "WOW",
  "TOP",
  "LUX",
  "MAX",
  "WIN",
  "ONE",
  "KEY",
  "NEW",
  "ART",
  "ZEN",
  "SKY",
  "SUN",
  "GEM",
  "FLY",
  "FOX",
  "ICE",
  "BIG",
  "BUY",
];

/**
 * Letter combinations that are not for sale at any price.
 *
 * Not the rare-word list with the sign flipped. A rare word is priced high
 * because somebody wants it; these are refused because selling them would do
 * damage no price makes up for — and the damage is done to people who never
 * bought anything. `backend/internal/handles/blocked.go` says what is on the
 * list and why, group by group; it is the authority and this is the copy the
 * price calculator needs, because that runs in the browser and cannot wait for
 * a round trip per keystroke.
 *
 * A blocked combination is treated as though it were never part of the
 * namespace: `parseHandle` refuses it, so the page says the number does not
 * exist rather than naming a reason. A message that names the reason is a
 * message that maps the list.
 *
 * Yes, this ships to the browser. Everything on it is a word somebody could
 * guess in a minute; the alternative is quoting a price for a number that
 * cannot be bought and letting the buyer find out at checkout.
 */
export const BLOCKED_WORDS = [
  // Government bodies — the one group here that is a safety rule rather than
  // a taste one.
  "MVD",
  "IIB",
  "SSB",
  "DXX",
  "GAI",
  "YHX",
  "PRK",
  "GNK",
  "MCH",
  "SES",
  // Obscene in English.
  "SEX",
  "XXX",
  "PRN",
  "ASS",
  "FUK",
  "FCK",
  "CUM",
  "DIC",
  "DIK",
  "COK",
  "TIT",
  "NUD",
  "POR",
  // Obscene in Russian, written in Latin letters — which is how they are
  // actually typed here.
  "XUY",
  "XUI",
  "HUY",
  "HUI",
  "PIZ",
  "BLY",
  "BLD",
  "SUK",
  "EBA",
  "EBI",
  "EBU",
  "PID",
  "MUD",
  "NAX",
  // Obscene in Uzbek and Turkish. The shortest of the three, and the one most
  // likely to be incomplete.
  "SIK",
  "KOT",
  "AMK",
  "QIN",
  "SKM",
  "AMG",
  // Slurs.
  "GAY",
  "FAG",
  // Sacred names.
  "ALH",
  "XUD",
  "QUR",
  "HAJ",
];

const BLOCKED = new Set(BLOCKED_WORDS);

/** Whether a combination of letters may not be sold. */
export function isBlocked(letters: string): boolean {
  return BLOCKED.has(letters.toUpperCase());
}

export function letterRarity(letters: string): {
  multiplier: number;
  reason: string;
} {
  const l = letters.toUpperCase().split("");
  if (TOP.has(letters.toUpperCase())) {
    return { multiplier: 50, reason: "status so'zi (masalan VIP)" };
  }
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

export function digitRarity(digits: string): {
  multiplier: number;
  reason: string;
} {
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

export function parseHandle(
  raw: string,
): { letters: string; digits: string } | null {
  const match = raw.toUpperCase().match(/^([A-Z]{3})(\d{3})$/);
  if (!match) return null;
  // A blocked combination fails here rather than being refused later, so every
  // caller gets the refusal without having to remember to ask.
  if (BLOCKED.has(match[1])) return null;
  return { letters: match[1], digits: match[2] };
}

export function priceForHandle(letters: string, digits: string): number {
  return (
    BASE_PRICE *
    letterRarity(letters).multiplier *
    digitRarity(digits).multiplier
  );
}

// Genesis cards: pure 6-digit manufacturing serials (000001, 000002, ...) —
// a separate, parallel series from the AAA000 vanity handles above.
export function parseGenesisSerial(raw: string): string | null {
  const match = raw.match(/^\d{6}$/);
  return match ? match[0] : null;
}

/**
 * The rarity band a handle falls in, from its combined multiplier.
 *
 * The multipliers were always there and always invisible: "×1 oddiy
 * kombinatsiya" is arithmetic, and arithmetic does not make anybody want
 * something. A named band does — it turns a number into a thing worth having,
 * and it is the same information either way.
 *
 * The boundaries follow the multipliers rather than being chosen for effect. A
 * plain handle is exactly ×1; anything with one weak pattern lands in rare;
 * epic needs a strong pattern on one side; legendary needs two; and genesis is
 * reserved for the handful where both sides are at their strongest.
 */
export type RarityTier = "common" | "rare" | "epic" | "legendary" | "genesis";

export function rarityTier(letters: string, digits: string): RarityTier {
  const multiplier =
    letterRarity(letters).multiplier * digitRarity(digits).multiplier;
  if (multiplier >= 600) return "genesis";
  if (multiplier >= 100) return "legendary";
  if (multiplier >= 10) return "epic";
  if (multiplier > 1) return "rare";
  return "common";
}
