import { describe, it, expect } from "vitest";
import { parseServices, readServices, MAX_SERVICES } from "./services";

describe("parseServices", () => {
  it("keeps a price exactly as it was written", () => {
    expect(parseServices([{ name: "Konsultatsiya", price: "kelishilgan holda" }])).toEqual([
      { name: "Konsultatsiya", price: "kelishilgan holda" },
    ]);
  });

  it("allows a service with no price", () => {
    expect(parseServices([{ name: "Shartnoma tuzish", price: "  " }])).toEqual([
      { name: "Shartnoma tuzish", price: null },
    ]);
  });

  // Empty rows are how the form arrives when somebody fills in three of six.
  it("drops a row with no name, priced or not", () => {
    expect(parseServices([{ name: "  ", price: "500 000" }])).toEqual([]);
  });

  it("stops at the number a card can carry", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `Xizmat ${i}`, price: "" }));
    expect(parseServices(many)).toHaveLength(MAX_SERVICES);
  });
});

describe("readServices", () => {
  it("survives anything the column might hold", () => {
    expect(readServices(null)).toEqual([]);
    expect(readServices("xizmatlar")).toEqual([]);
    expect(readServices([{ price: "100" }, null, 5])).toEqual([]);
  });

  it("reads back what was stored", () => {
    expect(readServices([{ name: "Tish davolash", price: "300 000 so'm" }])).toEqual([
      { name: "Tish davolash", price: "300 000 so'm" },
    ]);
  });
});
