import { describe, expect, it } from "vitest";

import { heroCarousel } from "./strip-items";

describe("heroCarousel", () => {
  const items = heroCarousel("uz");
  const objectOf = (src: string) =>
    src.replace(/^.*\/|-\d+\.png$|\.png$/g, "");

  it("shows every finish that exists", () => {
    // Six cards, six rings, eight bracelets, three car cards, five pet tags.
    expect(items).toHaveLength(28);
    expect(new Set(items.map((i) => i.src)).size).toBe(28);
  });

  it("never shows the same object twice running", () => {
    // The bracelet has five and the pet tag two; a pass per set would end
    // with bracelet after bracelet, which reads as the carousel having stalled.
    const objects = items.map((i) => objectOf(i.src));
    const stalls = objects.filter((o, i) => i > 0 && o === objects[i - 1]);
    expect(stalls).toEqual([]);
  });

  it("carries a name and a price on every turn", () => {
    expect(items.every((i) => i.name.length > 0 && i.price.length > 0)).toBe(true);
    expect(items.every((i) => i.href.startsWith("/qurilmalar"))).toBe(true);
  });
});
