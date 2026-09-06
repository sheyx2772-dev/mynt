import { describe, expect, it } from "vitest";
import { actionHref, imageSrc, linkText, telHref, mailHref } from "./links";

describe("imageSrc", () => {
  it("allows relative upload paths", () => {
    expect(imageSrc("/uploads/avatars/user.jpg")).toBe("/uploads/avatars/user.jpg");
    expect(imageSrc("  /uploads/banners/cover.png ")).toBe("/uploads/banners/cover.png");
  });

  it("converts absolute upload paths with domain to relative pathname", () => {
    expect(imageSrc("https://arend.uz/uploads/banners/bg.webp")).toBe(
      "/uploads/banners/bg.webp",
    );
  });

  it("allows external https and http images", () => {
    expect(imageSrc("https://images.unsplash.com/photo-123")).toBe(
      "https://images.unsplash.com/photo-123",
    );
  });

  it("rejects non-http schemes, credentials or bad inputs", () => {
    expect(imageSrc(undefined)).toBeNull();
    expect(imageSrc("")).toBeNull();
    expect(imageSrc("javascript:alert(1)")).toBeNull();
    expect(imageSrc("data:image/png;base64,...")).toBeNull();
    expect(imageSrc("https://user:pass@evil.com/pic.jpg")).toBeNull();
  });
});

describe("actionHref & linkText", () => {
  it("formats tel and mailto correctly", () => {
    expect(telHref("+998 90 123 45 67")).toBe("tel:+998901234567");
    expect(mailHref("test@flex.uz")).toBe("mailto:test@flex.uz");
  });

  it("safely generates actionHref and linkText", () => {
    expect(actionHref("https://t.me/flex_uz")).toBe("https://t.me/flex_uz");
    expect(linkText("https://t.me/flex_uz")).toBe("t.me/flex_uz");
  });
});
