import { describe, it, expect } from "vitest";

import { segments } from "./post-text";

describe("segments", () => {
  it("leaves a post with no address as one run of text", () => {
    expect(segments("Bugun yangi karta keldi.")).toEqual([
      { kind: "text", text: "Bugun yangi karta keldi." },
    ]);
  });

  it("splits an address out and keeps the text around it", () => {
    expect(segments("Qarang https://arend.uz/AAA777 — mana")).toEqual([
      { kind: "text", text: "Qarang " },
      {
        kind: "link",
        text: "https://arend.uz/AAA777",
        href: "https://arend.uz/AAA777",
      },
      { kind: "text", text: " — mana" },
    ]);
  });

  it("leaves the sentence's full stop out of the link", () => {
    const [link] = segments("https://arend.uz.") as [
      { kind: "link"; text: string; href: string },
    ];
    expect(link.text).toBe("https://arend.uz");
    expect(link.href).toBe("https://arend.uz/");
  });

  // The whole reason this file exists: a post is written by one person and
  // read by everybody, so a scheme nobody vetted must never reach an `href`.
  it("never links a scheme other than http or https", () => {
    for (const hostile of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "JaVaScRiPt:alert(1)",
    ]) {
      expect(segments(hostile)).toEqual([{ kind: "text", text: hostile }]);
    }
  });

  it("does not invent a scheme for a bare host", () => {
    expect(segments("arend.uz/AAA777")).toEqual([
      { kind: "text", text: "arend.uz/AAA777" },
    ]);
  });

  it("returns markup as text rather than as a link or a tag", () => {
    const body = '<img src=x onerror="alert(1)">';
    expect(segments(body)).toEqual([{ kind: "text", text: body }]);
  });

  it("puts every character of the post into exactly one segment", () => {
    const body = "a https://arend.uz b https://example.com/x?y=1 c";
    expect(
      segments(body)
        .map((s) => s.text)
        .join(""),
    ).toBe(body);
  });
});
