import { describe, expect, it } from "vitest";

import { readLinkInput, toLinkInput } from "./links";

describe("toLinkInput", () => {
  it("recovers the username a social field expects", () => {
    expect(
      toLinkInput([{ label: "Telegram", href: "https://t.me/aziz" }]),
    ).toEqual({ telegram: "aziz" });
  });

  it("keeps a whole address for the fields that take one", () => {
    expect(
      toLinkInput([
        { label: "Veb-sayt", href: "https://flex.uz/" },
        { label: "To'lash", href: "https://payme.uz/x", kind: "payment" },
      ]),
    ).toEqual({ website: "https://flex.uz/", payment: "https://payme.uz/x" });
  });

  it("turns wa.me back into a phone number", () => {
    expect(
      toLinkInput([{ label: "WhatsApp", href: "https://wa.me/99890" }]),
    ).toEqual({ whatsapp: "+99890" });
  });

  it("recovers a link by its kind when the label is not ours", () => {
    expect(
      toLinkInput([
        {
          label: "rahimov.capital",
          href: "https://rahimov.capital",
          kind: "website",
        },
        { label: "TG", href: "https://t.me/sardor", kind: "telegram" },
      ]),
    ).toEqual({ website: "https://rahimov.capital", telegram: "sardor" });
  });

  it("ignores labels it did not write", () => {
    expect(toLinkInput([{ label: "Evil", href: "javascript:1" }])).toEqual({});
  });
});

describe("readLinkInput", () => {
  it("drops empty fields and trims the rest", () => {
    const form: Record<string, string> = { telegram: " aziz ", website: "" };
    expect(readLinkInput((n) => form[n] ?? "")).toEqual({ telegram: "aziz" });
  });
});
