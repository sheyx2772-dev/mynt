import { describe, it, expect } from "vitest";
import { safePath } from "./safe-path";

describe("safePath", () => {
  it("keeps an ordinary in-app path", () => {
    expect(safePath("/kabinet")).toBe("/kabinet");
    expect(safePath("/MYN042")).toBe("/MYN042");
    expect(safePath("/rezidentlar?q=Toshkent")).toBe("/rezidentlar?q=Toshkent");
    expect(safePath("/kabinet/KAB777#qr")).toBe("/kabinet/KAB777#qr");
  });

  // The bypass this function exists for: browsers read `\` as `/`, so
  // `/\evil.com` is fetched as `//evil.com`.
  it("refuses a backslash-disguised protocol-relative path", () => {
    expect(safePath("/\\evil.com")).toBe("/");
    expect(safePath("/\\\\evil.com")).toBe("/");
    expect(safePath("\\/evil.com")).toBe("/");
    expect(safePath("/\\/evil.com")).toBe("/");
  });

  it("refuses protocol-relative and absolute targets", () => {
    expect(safePath("//evil.com")).toBe("/");
    expect(safePath("https://evil.com")).toBe("/");
    expect(safePath("http://evil.com/x")).toBe("/");
    expect(safePath("//evil.com/kabinet")).toBe("/");
  });

  it("refuses non-http schemes", () => {
    expect(safePath("javascript:alert(1)")).toBe("/");
    expect(safePath("data:text/html,<script>alert(1)</script>")).toBe("/");
    expect(safePath("mailto:a@b.uz")).toBe("/");
  });

  // A credentialed authority is how "https://mynt.uz@evil.com" reads as one
  // host and resolves to another.
  it("refuses an authority carrying credentials", () => {
    expect(safePath("https://mynt.uz@evil.com")).toBe("/");
    expect(safePath("//mynt.uz@evil.com")).toBe("/");
  });

  // A bare relative string resolves against the base and therefore stays on
  // this site — it is normalised rather than refused.
  it("normalises a relative path instead of refusing it", () => {
    expect(safePath("kabinet")).toBe("/kabinet");
    expect(safePath("../../etc")).toBe("/etc");
    // Still on-site: the host part becomes a path segment, not a host.
    expect(safePath("evil.com")).toBe("/evil.com");
  });

  it("falls back for empty and non-string input", () => {
    expect(safePath("")).toBe("/");
    expect(safePath(undefined)).toBe("/");
    expect(safePath(null)).toBe("/");
    expect(safePath(["/kabinet"])).toBe("/");
  });

  it("honours a custom fallback", () => {
    expect(safePath("https://evil.com", "/kabinet")).toBe("/kabinet");
  });
});
