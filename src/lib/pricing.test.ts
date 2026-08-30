import { describe, it, expect } from "vitest";
import {
  BASE_PRICE,
  parseHandle,
  parseGenesisSerial,
  letterRarity,
  digitRarity,
  priceForHandle,
} from "./pricing";

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
