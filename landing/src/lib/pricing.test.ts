import { describe, it, expect } from "vitest";
import { BASE_PRICE, parseHandle, parseGenesisSerial, letterRarity, digitRarity, priceForHandle, rarityTier } from "./pricing";

describe("parseHandle", () => {
  it("accepts the AAA000 shape and normalizes case", () => {
    expect(parseHandle("myn042")).toEqual({ letters: "MYN", digits: "042" });
    expect(parseHandle("MYN042")).toEqual({ letters: "MYN", digits: "042" });
  });

  it("rejects anything that isn't exactly 3 letters then 3 digits", () => {
    for (const bad of ["MYN04", "MYN0422", "MY0422", "123456", "MYNABC", "M1N042", "", "МЫН042"]) {
      expect(parseHandle(bad), bad).toBeNull();
    }
  });

  // The server action re-parses attacker-controlled input with this function,
  // so a leading/trailing extra must not slip through.
  it("is anchored — no prefix or suffix is tolerated", () => {
    expect(parseHandle(" MYN042")).toBeNull();
    expect(parseHandle("MYN042 ")).toBeNull();
    expect(parseHandle("xMYN042")).toBeNull();
    expect(parseHandle("MYN042\nAAA000")).toBeNull();
  });
});

describe("parseGenesisSerial", () => {
  it("accepts exactly six digits", () => {
    expect(parseGenesisSerial("000001")).toBe("000001");
    expect(parseGenesisSerial("999999")).toBe("999999");
  });

  it("rejects other lengths and non-digits", () => {
    for (const bad of ["00001", "0000001", "00000a", "", " 000001"]) {
      expect(parseGenesisSerial(bad), bad).toBeNull();
    }
  });
});

describe("letterRarity", () => {
  it("ranks triples highest", () => {
    expect(letterRarity("AAA").multiplier).toBe(30);
  });

  it("recognizes known words", () => {
    expect(letterRarity("VIP").multiplier).toBe(20);
    expect(letterRarity("vip").multiplier).toBe(20);
  });

  it("recognizes the ABA palindrome shape", () => {
    expect(letterRarity("ABA").multiplier).toBe(4);
  });

  it("falls back to 1 for ordinary combinations", () => {
    expect(letterRarity("MYN").multiplier).toBe(1);
  });

  it("prefers the triple rule over the palindrome rule", () => {
    // "AAA" satisfies both l[0]===l[2] and the triple check.
    expect(letterRarity("AAA").multiplier).toBe(30);
  });
});

describe("digitRarity", () => {
  it("ranks triples highest", () => {
    expect(digitRarity("777").multiplier).toBe(40);
    expect(digitRarity("000").multiplier).toBe(40);
  });

  it("ranks a double-zero prefix next", () => {
    expect(digitRarity("007").multiplier).toBe(15);
  });

  it("recognizes runs in both directions", () => {
    expect(digitRarity("123").multiplier).toBe(12);
    expect(digitRarity("321").multiplier).toBe(12);
  });

  it("recognizes the palindrome shape", () => {
    expect(digitRarity("121").multiplier).toBe(5);
  });

  it("falls back to 1 for ordinary numbers", () => {
    expect(digitRarity("042").multiplier).toBe(1);
  });

  it("does not treat a wrapping sequence as a run", () => {
    // 8-9-0 is not ascending: the rule is arithmetic, not modular.
    expect(digitRarity("890").multiplier).toBe(1);
  });
});

describe("priceForHandle", () => {
  it("multiplies the base price by both rarity factors", () => {
    expect(priceForHandle("MYN", "042")).toBe(BASE_PRICE);
    expect(priceForHandle("AAA", "777")).toBe(BASE_PRICE * 30 * 40);
    expect(priceForHandle("VIP", "007")).toBe(BASE_PRICE * 20 * 15);
  });

  it("is case-insensitive, so the same handle never has two prices", () => {
    expect(priceForHandle("vip", "007")).toBe(priceForHandle("VIP", "007"));
  });

  it("never returns a price below the base", () => {
    expect(priceForHandle("QXZ", "483")).toBeGreaterThanOrEqual(BASE_PRICE);
  });
});

describe("rarityTier", () => {
  it("calls a plain handle plain", () => {
    expect(rarityTier("MYN", "042")).toBe("common");
  });

  it("names a single weak pattern rare", () => {
    // A letter palindrome on its own: ×4.
    expect(rarityTier("ABA", "042")).toBe("rare");
  });

  it("names one strong pattern epic", () => {
    // Three identical digits: ×40.
    expect(rarityTier("MYN", "777")).toBe("epic");
  });

  it("needs two strong patterns for legendary", () => {
    // A short word and a leading double zero: ×20 × ×15 = ×300.
    expect(rarityTier("VIP", "007")).toBe("legendary");
  });

  it("reserves genesis for both sides at their strongest", () => {
    // ×30 × ×40 = ×1200, the highest a handle can reach.
    expect(rarityTier("AAA", "000")).toBe("genesis");
  });

  // The bands are read off the multipliers, so they cannot disagree with the
  // price: a dearer handle is never in a lower band.
  it("never ranks a dearer handle below a cheaper one", () => {
    const order: Record<string, number> = {
      common: 0, rare: 1, epic: 2, legendary: 3, genesis: 4,
    };
    const samples = [
      ["MYN", "042"], ["ABA", "042"], ["MYN", "777"], ["VIP", "007"], ["AAA", "000"],
    ] as const;
    const ranked = samples
      .map(([l, d]) => ({ price: priceForHandle(l, d), band: order[rarityTier(l, d)]! }))
      .sort((a, b) => a.price - b.price);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.band).toBeGreaterThanOrEqual(ranked[i - 1]!.band);
    }
  });
});
