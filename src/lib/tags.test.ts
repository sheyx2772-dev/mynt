import { describe, expect, it } from "vitest";

import {
  MESSAGE_KINDS,
  TAG_KINDS,
  isMessageKind,
  isTagKind,
  needsReply,
  noticeTitle,
  offeredFor,
  tagWords,
} from "@/lib/tags";

describe("offeredFor", () => {
  it("offers a car the things that happen to cars", () => {
    expect(offeredFor("car")).toEqual(["blocking", "lights", "damage", "other"]);
  });

  it("offers a pet only the errand somebody is actually on", () => {
    // Nobody taps a dog's collar to report that it is blocking the road.
    expect(offeredFor("pet")).toEqual(["found", "other"]);
    expect(offeredFor("thing")).toEqual(["found", "other"]);
  });

  it("puts the most likely press first and the typing one last", () => {
    for (const kind of TAG_KINDS) {
      const offered = offeredFor(kind);
      expect(offered[offered.length - 1]).toBe("other");
    }
  });

  it("only ever offers kinds the database accepts", () => {
    for (const kind of TAG_KINDS) {
      for (const message of offeredFor(kind)) {
        expect(MESSAGE_KINDS).toContain(message);
      }
    }
  });
});

describe("needsReply", () => {
  it("knows when the owner just has to come down", () => {
    // "You are blocking me in" is answered by the car moving.
    expect(needsReply("blocking")).toBe(false);
    expect(needsReply("lights")).toBe(false);
    expect(needsReply("damage")).toBe(false);
  });

  it("knows when a message with no way back is useless", () => {
    // A found dog and no phone number is a dead end for both people.
    expect(needsReply("found")).toBe(true);
  });
});

describe("tagWords", () => {
  it("says everything in every language for every kind of thing", () => {
    for (const lang of ["uz", "ru", "en"] as const) {
      for (const kind of TAG_KINDS) {
        const w = tagWords(kind, lang);
        expect(w.heading).toBeTruthy();
        expect(w.lead).toBeTruthy();
        expect(w.send).toBeTruthy();
        expect(w.sent).toBeTruthy();
        for (const message of MESSAGE_KINDS) {
          expect(w.actions[message]).toBeTruthy();
        }
      }
    }
  });

  it("promises the car's owner privacy and the finder an answer", () => {
    // The two screens make different promises because the errands differ.
    expect(tagWords("car", "uz").lead).toContain("ko'rinmaydi");
    expect(tagWords("pet", "uz").lead).toContain("bog'lanadi");
  });

  it("tells a finder why the field matters rather than labelling it", () => {
    expect(tagWords("pet", "uz").replyHint).toContain("busiz");
  });
});

describe("noticeTitle", () => {
  it("leads with what happened, then which thing", () => {
    // Read at arm's length on a lock screen: the event first.
    expect(noticeTitle("car", "blocking", "Malibu", "uz")).toBe(
      "Yo'lni to'sib qo'ygan — Malibu",
    );
  });

  it("drops the name when the owner never gave one", () => {
    expect(noticeTitle("pet", "found", null, "uz")).toBe("Topib oldim");
  });
});

describe("guards", () => {
  it("accept what the database allows and nothing else", () => {
    expect(isTagKind("car")).toBe(true);
    expect(isTagKind("bike")).toBe(false);
    expect(isMessageKind("found")).toBe(true);
    expect(isMessageKind("hello")).toBe(false);
    expect(isMessageKind(null)).toBe(false);
  });
});
