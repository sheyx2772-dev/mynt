import { describe, expect, it } from "vitest";

import { addressLine, digitsOf, parseDelivery } from "@/lib/delivery";

function form(fields: Record<string, string>) {
  return { get: (name: string) => fields[name] ?? null };
}

const good = {
  recipient: "Javohir Abrorov",
  phone: "+998 97 724 79 99",
  region: "Toshkent",
  address: "Chilonzor tumani, 12-kvartal, 4-uy, 17-xonadon",
  note: "Kechqurun qo'ng'iroq qiling",
};

describe("parseDelivery", () => {
  it("takes an address somebody can deliver to", () => {
    const result = parseDelivery(form(good));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delivery.recipient).toBe("Javohir Abrorov");
    expect(result.delivery.region).toBe("Toshkent");
    expect(result.delivery.note).toBe("Kechqurun qo'ng'iroq qiling");
  });

  it("keeps the phone as typed, because a person reads it", () => {
    const result = parseDelivery(form(good));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Not normalised to digits: a courier dials what is written, and stripping
    // the shape of it makes it harder to read, not easier.
    expect(result.delivery.phone).toBe("+998 97 724 79 99");
  });

  it("accepts a local number without the country code", () => {
    const result = parseDelivery(form({ ...good, phone: "97 724 79 99" }));

    expect(result.ok).toBe(true);
  });

  it("refuses a phone with too few digits, however it is punctuated", () => {
    const result = parseDelivery(form({ ...good, phone: "+998 (97) 72" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.phone).toBeDefined();
  });

  it("refuses letters in a phone number", () => {
    const result = parseDelivery(form({ ...good, phone: "997247999 uyda" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.phone).toBeDefined();
  });

  it("refuses a street line that is only a city", () => {
    const result = parseDelivery(form({ ...good, address: "Tosh" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.address).toBeDefined();
  });

  it("reports every problem at once", () => {
    const result = parseDelivery(
      form({ recipient: "A", phone: "1", region: "", address: "x", note: "" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Four round trips to discover four problems, on a form shown to somebody
    // who has already paid, is the worst possible moment for it.
    expect(Object.keys(result.errors).sort()).toEqual([
      "address",
      "phone",
      "recipient",
      "region",
    ]);
  });

  it("squashes the whitespace people paste in", () => {
    const result = parseDelivery(
      form({ ...good, recipient: "  Javohir   Abrorov \n" }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delivery.recipient).toBe("Javohir Abrorov");
  });

  it("treats a blank note as no note", () => {
    const result = parseDelivery(form({ ...good, note: "   " }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delivery.note).toBeNull();
  });

  it("cuts a note that would overflow the column", () => {
    const result = parseDelivery(form({ ...good, note: "x".repeat(400) }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delivery.note).toHaveLength(300);
  });

  it("refuses a name too long for the column rather than truncating it", () => {
    const result = parseDelivery(form({ ...good, recipient: "A".repeat(81) }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // A cut name is a wrong name; a cut note is still the note.
    expect(result.errors.recipient).toBeDefined();
  });

  it("survives a form with nothing in it", () => {
    const result = parseDelivery({ get: () => null });

    expect(result.ok).toBe(false);
  });
});

describe("digitsOf", () => {
  it("counts only the digits", () => {
    expect(digitsOf("+998 (97) 724-79-99")).toBe("998977247999");
  });
});

describe("addressLine", () => {
  it("joins the region and the street", () => {
    expect(addressLine({ region: "Toshkent", address: "Chilonzor 12/4" })).toBe(
      "Toshkent, Chilonzor 12/4",
    );
  });
});
