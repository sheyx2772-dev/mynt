import { describe, expect, it } from "vitest";

import { identifiersOf, redact, scrubName } from "@/lib/ai/redact";
import type { Contact } from "@/lib/crm";

const TODAY = new Date("2026-09-10T09:00:00Z");

function daysAgo(n: number): string {
  return new Date(TODAY.getTime() - n * 86_400_000).toISOString();
}

function contact(over: Partial<Contact> = {}): Contact {
  return {
    id: 1,
    name: "Dilnoza Karimova",
    phone: "+998901234567",
    email: "dilnoza@example.uz",
    company: "Uzum",
    note: null,
    ownerNote: null,
    stage: "new",
    tags: [],
    followUpOn: null,
    lastTouchAt: null,
    source: "nfc",
    createdAt: daysAgo(0),
    ...over,
  };
}

describe("redact", () => {
  it("never lets a name, a phone or an email leave", () => {
    // The whole point of the module. Serialised exactly as it would be sent.
    const people = [
      contact({ id: 1, note: "Qandolat kerak" }),
      contact({
        id: 2,
        name: "Bekzod Yo'ldoshev",
        phone: "+998907654321",
        email: "bek@example.uz",
        ownerNote: "Narx yubordim",
      }),
    ];

    const { brief } = redact(people, TODAY);
    const sent = JSON.stringify(brief);

    for (const identifier of identifiersOf(people)) {
      expect(sent).not.toContain(identifier);
    }
  });

  it("gives every contact a reference the answer can point at", () => {
    const { brief, back } = redact([contact({ id: 41 }), contact({ id: 77 })], TODAY);

    expect(brief.map((b) => b.ref)).toEqual(["K1", "K2"]);
    // The mapping back is what lets a screen show a name the model never saw.
    expect(back.get("K1")).toBe(41);
    expect(back.get("K2")).toBe(77);
  });

  it("keeps the company, because a network is shaped by firms", () => {
    const { brief } = redact([contact({ company: " Uzum " })], TODAY);

    expect(brief[0].company).toBe("Uzum");
  });

  it("sends the shape of the wait, not the dates", () => {
    const { brief } = redact(
      [
        contact({
          createdAt: daysAgo(12),
          lastTouchAt: daysAgo(5),
          followUpOn: "2026-09-08",
          stage: "talking",
          tags: ["qurilish"],
        }),
      ],
      TODAY,
    );

    expect(brief[0]).toMatchObject({
      age: 12,
      quiet: 5,
      due: -2,
      stage: "talking",
      reason: "overdue",
      tags: ["qurilish"],
    });
  });

  it("has nothing to say about a contact nobody has touched", () => {
    const { brief } = redact([contact()], TODAY);

    expect(brief[0].quiet).toBeNull();
    expect(brief[0].due).toBeNull();
    expect(brief[0].said).toBeNull();
    expect(brief[0].noted).toBeNull();
  });

  it("keeps the substance of a note, which is why it is sent at all", () => {
    const { brief } = redact(
      [contact({ ownerNote: "Narx yubordim, javob yo'q" })],
      TODAY,
    );

    // Without this the assistant can only count rows.
    expect(brief[0].noted).toBe("Narx yubordim, javob yo'q");
  });

  it("takes a person's own name out of the notes about them", () => {
    const { brief } = redact(
      [
        contact({
          note: "Dilnoza qandolat buyurtma qiladi",
          ownerNote: "Karimovaga dushanba yozish",
        }),
      ],
      TODAY,
    );

    expect(brief[0].said).not.toContain("Dilnoza");
    expect(brief[0].noted).not.toContain("Karimova");
    // And what is left is still a sentence.
    expect(brief[0].said).toContain("qandolat buyurtma qiladi");
  });

  it("survives an empty list", () => {
    const { brief, back } = redact([], TODAY);

    expect(brief).toEqual([]);
    expect(back.size).toBe(0);
  });
});

describe("scrubName", () => {
  it("removes a name however it is cased", () => {
    expect(scrubName("DILNOZA keldi", "Dilnoza")).toBe("— keldi");
  });

  it("removes either part of a full name on its own", () => {
    expect(scrubName("Karimova bilan gaplashdim", "Dilnoza Karimova")).toBe(
      "— bilan gaplashdim",
    );
  });

  it("leaves short fragments alone rather than punching holes", () => {
    // A two-letter particle would match half the words in a sentence.
    expect(scrubName("Ali va Vali keldi", "Ma Ali")).toBe("— va Vali keldi");
  });

  it("catches a name carrying an Uzbek case ending", () => {
    // The form a name is actually written in: Karimovaga, Dilnozadan.
    expect(scrubName("Karimovaga yozdim", "Dilnoza Karimova")).toBe("— yozdim");
    expect(scrubName("Dilnozadan javob keldi", "Dilnoza")).toBe("— javob keldi");
  });

  it("over-scrubs rather than under-scrubs a name inside a longer one", () => {
    // "Alisher" is somebody else, and loses a word here. That is the right way
    // round to be wrong: a lost word costs a little substance, a missed name
    // goes to a vendor.
    expect(scrubName("Alisher keldi", "Ali")).toBe("— keldi");
  });

  it("does not treat a name as a regular expression", () => {
    // A name is somebody's input; if it reached the pattern unescaped, a
    // bracket in it would throw and take the whole brief down with it.
    expect(() => scrubName("matn", "A(bc")).not.toThrow();
  });

  it("leaves text alone when the name is not in it", () => {
    expect(scrubName("Narx yubordim", "Dilnoza")).toBe("Narx yubordim");
  });
});
