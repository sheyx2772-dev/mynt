import { describe, expect, it } from "vitest";

import { LAYOUT_ORDER, ORG_ORDER, bySampleOrder } from "./sample-order";
import { LAYOUTS } from "@/components/ui/LayoutSamples";
import { orgSamples, hasOwnLogo } from "./org-samples";

const layoutNames = LAYOUTS.map((l) => l.name);
const orgIds = orgSamples().map((p) => p.id);

describe("sample order", () => {
  it("names every layout and every organisation", () => {
    // A typo in one of these lists is invisible on the page — the tile simply
    // slides to the end — so it is caught here instead.
    expect([...LAYOUT_ORDER].sort()).toEqual([...layoutNames].sort());
    expect([...ORG_ORDER].sort()).toEqual([...orgIds].sort());
  });

  it("keeps everything when a sample is missing from the list", () => {
    const ordered = bySampleOrder(["c", "a", "unlisted", "b"], (x) => x, [
      "a",
      "b",
      "c",
    ]);
    expect(ordered).toEqual(["a", "b", "c", "unlisted"]);
  });

  it("never puts two of the same NFC template side by side", () => {
    const ordered = bySampleOrder(layoutNames, (n) => n, LAYOUT_ORDER);
    const nfc = ordered.map((n) => n.startsWith("NFC vizitka"));
    expect(nfc.some((v, i) => v && nfc[i + 1])).toBe(false);
  });

  it("puts the organisations without their own logo last", () => {
    const ordered = bySampleOrder(orgIds, (id) => id, ORG_ORDER);
    const withLogo = ordered.map(hasOwnLogo);
    // Once the first blank one appears, none with a logo may follow.
    expect(withLogo.indexOf(false)).toBe(withLogo.lastIndexOf(true) + 1);
  });
});
