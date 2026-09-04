import { describe, it, expect } from "vitest";
import { parseTags, parseContactEmail, linkFieldValue, parsePhone } from "./profile-form";

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
    expect(parseContactEmail(" aziz@flex.com.uz ")).toBe("aziz@flex.com.uz");
  });

  it("rejects anything that is not one", () => {
    for (const bad of ["aziz", "aziz@", "@flex.com.uz", "aziz@flex", "a b@c.uz"]) {
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
    { label: "Veb-sayt", href: "https://flex.com.uz/" },
  ];

  it("recovers the username a social field expects", () => {
    expect(linkFieldValue(links, "Telegram")).toBe("aziz");
  });

  it("returns the full URL for the website field", () => {
    expect(linkFieldValue(links, "Veb-sayt")).toBe("https://flex.com.uz/");
  });

  it("returns an empty string when the link is absent", () => {
    expect(linkFieldValue(links, "Instagram")).toBe("");
  });
});

describe("parsePhone", () => {
  it("keeps the owner's own formatting", () => {
    expect(parsePhone("+998 90 123 45 67")).toBe("+998 90 123 45 67");
    expect(parsePhone("(71) 231-08-83")).toBe("(71) 231-08-83");
  });

  it("treats an empty field as no phone rather than an error", () => {
    expect(parsePhone("")).toBeNull();
    expect(parsePhone("   ")).toBeNull();
  });

  // A tel: link is built from this, so anything that is not a number has to be
  // dropped rather than rendered as a dial button that dials nothing.
  it("rejects anything that is not a number", () => {
    expect(parsePhone("qo'ng'iroq qiling")).toBeNull();
    expect(parsePhone("12345")).toBeNull();
    expect(parsePhone("1".repeat(31))).toBeNull();
  });
});
