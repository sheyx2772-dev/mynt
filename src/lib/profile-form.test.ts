import { describe, it, expect } from "vitest";
import { parseTags, parseContactEmail, linkFieldValue } from "./profile-form";

describe("parseTags", () => {
  it("splits on commas and whitespace and strips a leading hash", () => {
    expect(parseTags("#Startup, dizayn  IT")).toEqual(["Startup", "dizayn", "IT"]);
  });

  it("keeps letters and digits from any alphabet", () => {
    expect(parseTags("Toshkent, дизайн, o'zbek")).toEqual(["Toshkent", "дизайн", "ozbek"]);
  });

  // Tags end up in search filters and in "#tag" labels, so anything that
  // could change how they are parsed downstream is removed.
  it("drops punctuation and separators", () => {
    expect(parseTags("a/b, c(d), e%f")).toEqual(["ab", "cd", "ef"]);
    expect(parseTags("...")).toEqual([]);
  });

  it("removes duplicates and caps the count", () => {
    expect(parseTags("a, a, b")).toEqual(["a", "b"]);
    expect(parseTags("a b c d e f g h")).toHaveLength(5);
  });

  it("truncates a very long tag", () => {
    expect(parseTags("x".repeat(50))[0]).toHaveLength(20);
  });

  it("returns an empty list for empty input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ")).toEqual([]);
  });
});

describe("parseContactEmail", () => {
  it("accepts an address", () => {
    expect(parseContactEmail(" aziz@mynt.uz ")).toBe("aziz@mynt.uz");
  });

  it("rejects anything that is not one", () => {
    for (const bad of ["aziz", "aziz@", "@mynt.uz", "aziz@mynt", "a b@c.uz"]) {
      expect(parseContactEmail(bad), bad).toBeNull();
    }
  });

  it("treats empty input as absent", () => {
    expect(parseContactEmail("")).toBeNull();
    expect(parseContactEmail("  ")).toBeNull();
  });
});

describe("linkFieldValue", () => {
  const links = [
    { label: "Telegram", href: "https://t.me/aziz" },
    { label: "Veb-sayt", href: "https://mynt.uz/" },
  ];

  it("recovers the username a social field expects", () => {
    expect(linkFieldValue(links, "Telegram")).toBe("aziz");
  });

  it("returns the full URL for the website field", () => {
    expect(linkFieldValue(links, "Veb-sayt")).toBe("https://mynt.uz/");
  });

  it("returns an empty string when the link is absent", () => {
    expect(linkFieldValue(links, "Instagram")).toBe("");
  });
});
