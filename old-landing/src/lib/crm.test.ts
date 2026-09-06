import { describe, expect, it } from "vitest";

import {
  NEGLECTED_DAYS,
  QUIET_DAYS,
  UNANSWERED_DAYS,
  UNANSWERED_UNTIL,
  byAttention,
  isStage,
  reasonFor,
  reasonLabel,
  shapeOf,
  stageLabel,
  waitingCount,
  type Contact,
  type Stage,
} from "@/lib/crm";

const TODAY = new Date("2026-09-10T09:00:00Z");

function daysAgo(n: number): string {
  return new Date(TODAY.getTime() - n * 86_400_000).toISOString();
}

function contact(over: Partial<Contact> = {}): Contact {
  return {
    id: 1,
    name: "Dilnoza Karimova",
    phone: "+998901234567",
    email: null,
    company: null,
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

describe("reasonFor", () => {
  it("says nothing about a tap from this morning", () => {
    // Somebody who tapped an hour ago is not a task yet.
    expect(reasonFor(contact(), TODAY)).toBeNull();
  });

  it("raises a tap nobody ever replied to", () => {
    // The failure this list exists to stop: a number handed over, no reply,
    // and nothing anywhere that will ever bring it up again.
    expect(reasonFor(contact({ createdAt: daysAgo(UNANSWERED_DAYS) }), TODAY)).toBe(
      "unanswered",
    );
  });

  it("puts an overdue promise above everything", () => {
    expect(reasonFor(contact({ followUpOn: "2026-09-08" }), TODAY)).toBe("overdue");
  });

  it("knows today from tomorrow", () => {
    expect(reasonFor(contact({ followUpOn: "2026-09-10" }), TODAY)).toBe("today");
    expect(reasonFor(contact({ followUpOn: "2026-09-11" }), TODAY)).toBeNull();
  });

  it("lets a future diary entry silence an unanswered tap", () => {
    // A decision already taken must not be second-guessed onto today's list.
    const deferred = contact({ createdAt: daysAgo(20), followUpOn: "2026-09-25" });

    expect(reasonFor(deferred, TODAY)).toBeNull();
  });

  it("raises a conversation that has gone quiet", () => {
    const stalled = contact({ stage: "talking", lastTouchAt: daysAgo(QUIET_DAYS) });

    expect(reasonFor(stalled, TODAY)).toBe("quiet");
  });

  it("leaves a recent conversation alone", () => {
    const live = contact({ stage: "talking", lastTouchAt: daysAgo(3) });

    expect(reasonFor(live, TODAY)).toBeNull();
  });

  it("stops proposing somebody who was written off", () => {
    // A list that keeps offering a write-off is a list somebody stops opening.
    expect(reasonFor(contact({ stage: "cold", createdAt: daysAgo(90) }), TODAY)).toBeNull();
  });

  it("leaves a customer alone while they are being looked after", () => {
    const recent = contact({ stage: "client", lastTouchAt: daysAgo(5) });

    expect(reasonFor(recent, TODAY)).toBeNull();
  });

  it("raises a customer nobody has spoken to", () => {
    // The cheapest revenue on the screen: they have already bought once, and a
    // list that treats "client" as finished loses won accounts quietly.
    const ignored = contact({ stage: "client", lastTouchAt: daysAgo(NEGLECTED_DAYS) });

    expect(reasonFor(ignored, TODAY)).toBe("neglected");
  });

  it("stops nagging about a tap nobody will ever answer", () => {
    // Without an upper bound the list fills with taps from six months ago —
    // a backlog of guilt that produces nothing and teaches somebody to stop
    // opening the screen.
    const stale = contact({ createdAt: daysAgo(UNANSWERED_UNTIL + 1) });

    expect(reasonFor(stale, TODAY)).toBeNull();
  });

  it("still raises one inside the window", () => {
    expect(reasonFor(contact({ createdAt: daysAgo(UNANSWERED_UNTIL) }), TODAY)).toBe(
      "unanswered",
    );
  });

  it("still honours a diary entry on a closed contact", () => {
    // "Ring the customer in March" is a promise like any other.
    const booked = contact({ stage: "client", followUpOn: "2026-09-01" });

    expect(reasonFor(booked, TODAY)).toBe("overdue");
  });

  it("counts an unanswered tap from the tap, not from a note", () => {
    const written = contact({ createdAt: daysAgo(4), lastTouchAt: daysAgo(1) });

    // Still 'new', but somebody has been in the row since — the owner dealt
    // with them and left them where they were, so this is not a dropped tap.
    expect(reasonFor(written, TODAY)).toBe("unanswered");
  });
});

describe("byAttention", () => {
  it("puts broken promises first and finished people last", () => {
    const list = [
      contact({ id: 1, name: "Mijoz", stage: "client", createdAt: daysAgo(60) }),
      contact({ id: 2, name: "Jim", stage: "talking", lastTouchAt: daysAgo(40) }),
      contact({ id: 3, name: "Bugun", followUpOn: "2026-09-10" }),
      contact({ id: 4, name: "Kechikkan", followUpOn: "2026-09-01" }),
      contact({ id: 5, name: "Javobsiz", createdAt: daysAgo(5) }),
    ];

    expect(byAttention(list, TODAY).map((c) => c.id)).toEqual([4, 3, 5, 2, 1]);
  });

  it("breaks a tie on who has waited longest, not who is newest", () => {
    const list = [
      contact({ id: 1, name: "Yaqinda", createdAt: daysAgo(3) }),
      contact({ id: 2, name: "Uzoq", createdAt: daysAgo(6) }),
    ];

    // Two people equally overdue are not equally patient.
    expect(byAttention(list, TODAY).map((c) => c.id)).toEqual([2, 1]);
  });

  it("prefers a deal in motion when two are equally late", () => {
    // Three days overdue on a live negotiation beats twenty on one written
    // off. Applied inside a tier only — it never lifts anybody past a broken
    // promise.
    const list = [
      contact({ id: 1, stage: "cold", followUpOn: "2026-08-21" }),
      contact({ id: 2, stage: "talking", followUpOn: "2026-09-07" }),
    ];

    expect(byAttention(list, TODAY).map((c) => c.id)).toEqual([2, 1]);
  });

  it("does not mutate what it was given", () => {
    const list = [contact({ id: 1 }), contact({ id: 2, followUpOn: "2026-09-01" })];
    const before = list.map((c) => c.id);

    byAttention(list, TODAY);

    expect(list.map((c) => c.id)).toEqual(before);
  });

  it("handles an empty list", () => {
    expect(byAttention([], TODAY)).toEqual([]);
  });
});

describe("waitingCount", () => {
  it("counts only what needs something today", () => {
    const list = [
      contact({ id: 1, createdAt: daysAgo(5) }),
      contact({ id: 2, followUpOn: "2026-09-01" }),
      contact({ id: 3, stage: "client" }),
      contact({ id: 4 }),
    ];

    expect(waitingCount(list, TODAY)).toBe(2);
  });
});

describe("shapeOf", () => {
  it("counts the network by stage and by firm", () => {
    const list = [
      contact({ id: 1, company: "Uzum", stage: "client", email: "a@b.uz" }),
      contact({ id: 2, company: "Uzum", stage: "talking" }),
      contact({ id: 3, company: "Payme", stage: "new" }),
      contact({ id: 4, company: null, stage: "new", phone: null, email: "c@d.uz" }),
    ];

    const shape = shapeOf(list);

    expect(shape.total).toBe(4);
    expect(shape.byStage).toEqual({ new: 2, talking: 1, client: 1, cold: 0 });
    // Nine contacts at one firm is a relationship; nine at nine is a list.
    expect(shape.companies).toEqual([
      { name: "Uzum", count: 2 },
      { name: "Payme", count: 1 },
    ]);
    expect(shape.reachableByPhone).toBe(3);
    expect(shape.reachableByEmail).toBe(2);
  });

  it("ignores a blank company rather than counting it as a firm", () => {
    const shape = shapeOf([contact({ company: "   " })]);

    expect(shape.companies).toEqual([]);
  });
});

describe("words", () => {
  it("names every stage and every reason in every language", () => {
    for (const lang of ["uz", "ru", "en"] as const) {
      for (const stage of ["new", "talking", "client", "cold"] as Stage[]) {
        expect(stageLabel(stage, lang)).toBeTruthy();
      }
      for (const reason of [
        "overdue",
        "today",
        "unanswered",
        "quiet",
        "neglected",
      ] as const) {
        expect(reasonLabel(reason, lang)).toBeTruthy();
      }
      expect(reasonLabel(null, lang)).toBeNull();
    }
  });
});

describe("isStage", () => {
  it("accepts what the database allows and nothing else", () => {
    expect(isStage("talking")).toBe(true);
    expect(isStage("lead")).toBe(false);
    expect(isStage(null)).toBe(false);
  });
});
