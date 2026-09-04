import { describe, it, expect } from "vitest";
import { socialLink, websiteLink, buildProfileLinks, linkValue, whatsappLink, bookingLink } from "./links";

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

describe("linkValue", () => {
  it("shows the username, not the whole address", () => {
    expect(linkValue({ label: "Telegram", href: "https://t.me/javohir" })).toBe("@javohir");
    expect(linkValue({ label: "LinkedIn", href: "https://linkedin.com/in/aziz-karimov" })).toBe(
      "@aziz-karimov",
    );
  });

  it("shows a booking address in full, not as a username", () => {
    expect(linkValue({ label: "Uchrashuv", href: "https://calendly.com/aziz" })).toBe(
      "calendly.com/aziz",
    );
  });

  it("shows a WhatsApp link as the number it dials", () => {
    expect(linkValue({ label: "WhatsApp", href: "https://wa.me/998901234567" })).toBe(
      "+998901234567",
    );
  });

  it("shows a website by its host", () => {
    expect(linkValue({ label: "Veb-sayt", href: "https://www.flex.com.uz/" })).toBe("flex.com.uz");
    expect(linkValue({ label: "Veb-sayt", href: "https://mc-legal.uz/team" })).toBe(
      "mc-legal.uz/team",
    );
  });
});

describe("whatsappLink", () => {
  // wa.me refuses a plus or a space and shows "number is invalid", so what the
  // owner types is stripped down to digits rather than passed through.
  it("keeps only the digits", () => {
    expect(whatsappLink("+998 90 123 45 67")).toEqual({
      label: "WhatsApp",
      href: "https://wa.me/998901234567",
    });
    expect(whatsappLink("(90) 123-45-67")).toEqual({
      label: "WhatsApp",
      href: "https://wa.me/901234567",
    });
  });

  it("rejects something that is not a number", () => {
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink("yozing")).toBeNull();
    expect(whatsappLink("12345")).toBeNull();
    expect(whatsappLink("1".repeat(16))).toBeNull();
  });
});

describe("bookingLink", () => {
  it("takes any address and names it for what it does", () => {
    expect(bookingLink("calendly.com/aziz")).toEqual({
      label: "Uchrashuv",
      href: "https://calendly.com/aziz",
    });
  });

  // The same guards as a website link: this is rendered as a clickable anchor.
  it("refuses anything that is not an http address", () => {
    expect(bookingLink("javascript:alert(1)")).toBeNull();
    expect(bookingLink("https://flex.com.uz@evil.com")).toBeNull();
    expect(bookingLink("")).toBeNull();
  });
});

describe("buildProfileLinks", () => {
  it("puts the appointment first and the site last", () => {
    const links = buildProfileLinks({
      booking: "calendly.com/aziz",
      telegram: "@aziz",
      whatsapp: "+998901234567",
      instagram: "aziz",
      linkedin: "aziz-karimov",
      facebook: "aziz",
      youtube: "aziz",
      website: "flex.com.uz",
    });
    expect(links.map((l) => l.label)).toEqual([
      "Uchrashuv",
      "Telegram",
      "WhatsApp",
      "Instagram",
      "LinkedIn",
      "Facebook",
      "YouTube",
      "Veb-sayt",
    ]);
  });

  it("drops what was left empty without leaving a gap", () => {
    const links = buildProfileLinks({
      telegram: "@aziz",
      instagram: "",
      linkedin: "",
      website: "",
    });
    expect(links).toEqual([{ label: "Telegram", href: "https://t.me/aziz" }]);
  });
});
