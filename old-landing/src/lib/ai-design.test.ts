import { describe, expect, it } from "vitest";
import { buildDesignPrompt, screenWish, CARD_RATIO } from "@/lib/ai-design";

describe("screenWish", () => {
  it("accepts an ordinary description", () => {
    expect(screenWish("qora fonda lime chiziq, minimal")).toEqual({ ok: true });
  });

  it("refuses a state emblem however it is spelled", () => {
    for (const wish of [
      "O'zbekiston gerbi tilla rangda",
      "герб на черном фоне",
      "gold coat of arms",
      "davlat ramzi",
      "bayroq rangida",
    ]) {
      const verdict = screenWish(wish);
      expect(verdict.ok, wish).toBe(false);
      // The refusal has to name the alternatives, or it just stops the sale.
      if (!verdict.ok) expect(verdict.reason).toContain("Humo");
    }
  });

  it("refuses someone else's mark", () => {
    const verdict = screenWish("Porsche logotipi bilan");
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toContain("Uslubni");
  });

  it("is not fooled by a typographic apostrophe", () => {
    expect(screenWish("davlat gerbi").ok).toBe(false);
    expect(screenWish("davlat  gerbi  ").ok).toBe(false);
  });

  it("asks for more than a word, and refuses an essay", () => {
    expect(screenWish("ha").ok).toBe(false);
    expect(screenWish("a".repeat(401)).ok).toBe(false);
    expect(screenWish("a".repeat(399)).ok).toBe(true);
  });
});

describe("buildDesignPrompt", () => {
  const prompt = buildDesignPrompt("  deep   forest green with gold leaves  ");

  it("carries the buyer's words through", () => {
    expect(prompt).toContain("Design: deep forest green with gold leaves.");
  });

  it("pins the proportions a card is cut to", () => {
    expect(prompt).toContain(CARD_RATIO);
  });

  it("protects the areas the card prints over", () => {
    expect(prompt).toContain("lower-left quarter");
    expect(prompt).toContain("top-right corner");
  });

  it("repeats the limits the screen enforces, since the screen is only words", () => {
    expect(prompt).toContain("national emblem");
    expect(prompt).toContain("trademark");
  });

  it("keeps the press's limits in", () => {
    expect(prompt).toContain("0.3 mm");
    expect(prompt).toContain("CMYK");
  });
});
