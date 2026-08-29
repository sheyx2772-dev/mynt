export const BASE_PRICE = 99_000;
const RARE_WORDS = ["VIP", "CEO", "GOD", "SIR", "ACE", "WOW", "TOP", "BOS"];

export function letterRarity(letters: string): { multiplier: number; reason: string } {
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

export function digitRarity(digits: string): { multiplier: number; reason: string } {
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

export function parseHandle(raw: string): { letters: string; digits: string } | null {
  const match = raw.toUpperCase().match(/^([A-Z]{3})(\d{3})$/);
  if (!match) return null;
  return { letters: match[1], digits: match[2] };
}

export function priceForHandle(letters: string, digits: string): number {
  return BASE_PRICE * letterRarity(letters).multiplier * digitRarity(digits).multiplier;
}
