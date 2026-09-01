import { describe, it, expect } from "vitest";
import { socialLink, websiteLink, buildProfileLinks } from "./links";

describe("socialLink", () => {
  it("builds a profile URL and strips a leading @", () => {
    expect(socialLink("Telegram", "@aziz", "https://t.me/")).toEqual({
      label: "Telegram",
      href: "https://t.me/aziz",
    });
  });

  it("ignores empty and whitespace-only input", () => {
    expect(socialLink("Telegram", "", "https://t.me/")).toBeNull();
    expect(socialLink("Telegram", "   ", "https://t.me/")).toBeNull();
  });

  // A username lands inside a URL path, so anything that could change the
  // meaning of that path has to be refused.
  it("rejects usernames that could escape the path", () => {
    for (const bad of ["../evil", "a/b", "a?b=1", "a#b", "a b", "a\\b", "https://evil.com"]) {
      expect(socialLink("Telegram", bad, "https://t.me/"), bad).toBeNull();
    }
  });

  it("rejects usernames longer than the allowed length", () => {
    expect(socialLink("Telegram", "a".repeat(65), "https://t.me/")).toBeNull();
    expect(socialLink("Telegram", "a".repeat(64), "https://t.me/")).not.toBeNull();
  });
});

describe("websiteLink", () => {
  it("adds https:// when the scheme is missing", () => {
    expect(websiteLink("flex.com.uz")?.href).toBe("https://flex.com.uz/");
  });

  it("keeps an explicit http or https scheme", () => {
    expect(websiteLink("http://flex.com.uz")?.href).toBe("http://flex.com.uz/");
    expect(websiteLink("https://flex.com.uz/path")?.href).toBe("https://flex.com.uz/path");
  });

  // These would otherwise become clickable anchors on a public profile.
  it("rejects non-http schemes", () => {
    for (const bad of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "mailto:a@b.com",
      "file:///etc/passwd",
    ]) {
      expect(websiteLink(bad), bad).toBeNull();
    }
  });

  // "https://flex.com.uz@evil.com" reads as flex.com.uz but resolves to evil.com.
  it("rejects URLs carrying credentials in the authority", () => {
    expect(websiteLink("https://flex.com.uz@evil.com")).toBeNull();
    expect(websiteLink("https://user:pass@evil.com")).toBeNull();
  });

  it("rejects hosts without a dot", () => {
    expect(websiteLink("localhost")).toBeNull();
    expect(websiteLink("intranet")).toBeNull();
  });

  it("ignores empty input", () => {
    expect(websiteLink("")).toBeNull();
    expect(websiteLink("   ")).toBeNull();
  });
});

describe("buildProfileLinks", () => {
  it("keeps order and drops invalid entries", () => {
    expect(
      buildProfileLinks({
        telegram: "@aziz",
        instagram: "../evil",
        linkedin: "aziz-karimov",
        website: "flex.com.uz",
      })
    ).toEqual([
      { label: "Telegram", href: "https://t.me/aziz" },
      { label: "LinkedIn", href: "https://linkedin.com/in/aziz-karimov" },
      { label: "Veb-sayt", href: "https://flex.com.uz/" },
    ]);
  });

  it("returns an empty list when nothing is supplied", () => {
    expect(buildProfileLinks({ telegram: "", instagram: "", linkedin: "", website: "" })).toEqual([]);
  });
});
