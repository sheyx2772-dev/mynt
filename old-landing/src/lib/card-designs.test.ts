import { describe, it, expect } from "vitest";
import { CARD_DESIGNS, ACCENT_HEX, designAccent, accentHex } from "./card-designs";

describe("card accents", () => {
  it("gives the gold-engraved cards a gold profile", () => {
    expect(designAccent("xarita")).toBe("gold");
    expect(designAccent("suzani")).toBe("gold");
  });

  it("leaves everything else on the brand lime", () => {
    expect(designAccent("genesis")).toBe("lime");
    expect(accentHex("genesis")).toBe(ACCENT_HEX.lime);
  });

  // The card sets its labels at ten pixels in small caps, so the accents are
  // held well above the 4.5:1 floor rather than at it. A truer gold would pass
  // that floor at 6:1 and still be the wrong choice; this guards the margin.
  it("keeps every accent legible on the card", () => {
    const ground = [0x0b, 0x0b, 0x0f];
    const lum = (rgb: number[]) => {
      const [r, g, b] = rgb.map((c) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const parse = (hex: string) =>
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

    for (const [name, hex] of Object.entries(ACCENT_HEX)) {
      const ratio = (lum(parse(hex)) + 0.05) / (lum(ground) + 0.05);
      expect(ratio, `${name} (${hex}) on the card ground`).toBeGreaterThan(9);
    }
  });

  it("only names accents the palette defines", () => {
    for (const design of CARD_DESIGNS) {
      if ("accent" in design && design.accent) {
        expect(ACCENT_HEX[design.accent]).toBeDefined();
      }
    }
  });
});
