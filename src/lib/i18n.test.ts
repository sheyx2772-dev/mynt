import { describe, it, expect } from "vitest";
import { pickLang, dict, isLang, DEFAULT_LANG } from "./i18n";

describe("pickLang", () => {
  it("obeys an explicit choice over anything the browser says", () => {
    expect(pickLang("ru", "uz-UZ,uz;q=0.9")).toBe("ru");
    expect(pickLang("uz", "ru-RU,ru;q=0.9")).toBe("uz");
  });

  it("reads the browser's preference when nothing was chosen", () => {
    expect(pickLang(undefined, "uz-UZ,uz;q=0.9")).toBe("uz");
    expect(pickLang(undefined, "en-US,en;q=0.9")).toBe("en");
  });

  it("does not let a Russian browser decide", () => {
    // Phones are very often sold here set up in Russian and never changed, so
    // this header says little about which language somebody would rather read.
    // They are one tap from Russian and the choice is remembered.
    expect(pickLang(undefined, "ru-RU,ru;q=0.9,en;q=0.8")).toBe("uz");
    expect(pickLang(undefined, "ru")).toBe("uz");
  });

  it("reads English too", () => {
    expect(pickLang(undefined, "en-GB,en;q=0.9")).toBe("en");
    expect(pickLang("en", "ru-RU")).toBe("en");
  });

  // The first tag the browser sends that we actually have, not the first tag.
  it("skips languages the profile does not speak", () => {
    expect(pickLang(undefined, "de-DE,de;q=0.9,en;q=0.8")).toBe("en");
    expect(pickLang(undefined, "tr-TR,tr;q=0.9,en;q=0.7")).toBe("en");
  });

  it("falls back to Uzbek rather than guessing", () => {
    expect(pickLang(undefined, "de-DE,de;q=0.9")).toBe(DEFAULT_LANG);
    expect(pickLang(undefined, null)).toBe(DEFAULT_LANG);
    expect(pickLang("fr", "")).toBe(DEFAULT_LANG);
  });
});

describe("dict", () => {
  // A missing string renders as nothing, which is worse than the wrong
  // language: the label simply disappears and the row looks broken.
  it("has every key in every language", () => {
    const uz = Object.keys(dict("uz")).sort();
    for (const lang of ["ru", "en"] as const) {
      expect(Object.keys(dict(lang)).sort(), lang).toEqual(uz);
    }
  });

  it("names the owner in the sentences that address the visitor", () => {
    expect(dict("ru").reachYou("Азиз")).toContain("Азиз");
    expect(dict("uz").contactHint("Aziz")).toContain("Aziz");
    expect(dict("en").reachYou("Aziz")).toContain("Aziz");
  });
});

describe("isLang", () => {
  it("accepts only what the profile can render", () => {
    expect(isLang("uz")).toBe(true);
    expect(isLang("ru")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("de")).toBe(false);
    expect(isLang(null)).toBe(false);
  });
});
