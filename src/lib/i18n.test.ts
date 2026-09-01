import { describe, it, expect } from "vitest";
import { pickLang, dict, isLang, DEFAULT_LANG } from "./i18n";

describe("pickLang", () => {
  it("obeys an explicit choice over anything the browser says", () => {
    expect(pickLang("ru", "uz-UZ,uz;q=0.9")).toBe("ru");
    expect(pickLang("uz", "ru-RU,ru;q=0.9")).toBe("uz");
  });

  it("reads the browser's preference when nothing was chosen", () => {
    expect(pickLang(undefined, "ru-RU,ru;q=0.9,en;q=0.8")).toBe("ru");
    expect(pickLang(undefined, "uz-UZ,uz;q=0.9")).toBe("uz");
  });

  // The first tag the browser sends that we actually have, not the first tag.
  it("skips languages the profile does not speak", () => {
    expect(pickLang(undefined, "en-GB,en;q=0.9,ru;q=0.8")).toBe("ru");
  });

  it("falls back to Uzbek rather than guessing", () => {
    expect(pickLang(undefined, "en-US,en;q=0.9")).toBe(DEFAULT_LANG);
    expect(pickLang(undefined, null)).toBe(DEFAULT_LANG);
    expect(pickLang("de", "")).toBe(DEFAULT_LANG);
  });
});

describe("dict", () => {
  // A missing string renders as nothing, which is worse than the wrong
  // language: the label simply disappears and the row looks broken.
  it("has every key in both languages", () => {
    const uz = Object.keys(dict("uz")).sort();
    const ru = Object.keys(dict("ru")).sort();
    expect(ru).toEqual(uz);
  });

  it("names the owner in the sentences that address the visitor", () => {
    expect(dict("ru").reachYou("Азиз")).toContain("Азиз");
    expect(dict("uz").contactHint("Aziz")).toContain("Aziz");
  });
});

describe("isLang", () => {
  it("accepts only what the profile can render", () => {
    expect(isLang("ru")).toBe(true);
    expect(isLang("en")).toBe(false);
    expect(isLang(null)).toBe(false);
  });
});
