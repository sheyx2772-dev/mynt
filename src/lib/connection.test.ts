import { describe, expect, it } from "vitest";

import {
  LOST_AFTER_FAILURES,
  blindFor,
  countIsTrustworthy,
  linkState,
  linkWords,
} from "@/lib/connection";

describe("linkState", () => {
  it("is live while the server keeps answering", () => {
    expect(linkState(0)).toBe("live");
  });

  it("treats one missed poll as a blip, not an outage", () => {
    // A red bar several times an hour on an ordinary connection is a warning
    // people learn to look past, which leaves the screen lying again.
    expect(linkState(1)).toBe("slow");
  });

  it("calls it lost on the second failure in a row", () => {
    expect(linkState(LOST_AFTER_FAILURES)).toBe("lost");
    expect(linkState(9)).toBe("lost");
  });

  it("does not go strange on a negative count", () => {
    expect(linkState(-1)).toBe("live");
  });
});

describe("countIsTrustworthy", () => {
  it("believes the count while anything is getting through", () => {
    expect(countIsTrustworthy("live")).toBe(true);
    expect(countIsTrustworthy("slow")).toBe(true);
  });

  it("stops believing it once the screen is blind", () => {
    // "bo'sh" during an outage is a claim about a stale list, not the room.
    expect(countIsTrustworthy("lost")).toBe(false);
  });
});

describe("blindFor", () => {
  it("counts seconds for the first minute", () => {
    expect(blindFor(0)).toBe("0 soniya");
    expect(blindFor(20_000)).toBe("20 soniya");
    expect(blindFor(59_400)).toBe("59 soniya");
  });

  it("switches to minutes after that", () => {
    expect(blindFor(60_000)).toBe("1 daqiqa");
    expect(blindFor(9 * 60_000)).toBe("9 daqiqa");
  });

  it("says hours and minutes for a long outage", () => {
    expect(blindFor(60 * 60_000)).toBe("1 soat");
    expect(blindFor(95 * 60_000)).toBe("1 soat 35 daqiqa");
  });

  it("never reports negative time", () => {
    expect(blindFor(-5000)).toBe("0 soniya");
  });
});

describe("linkWords", () => {
  it("says nothing at all while connected", () => {
    // Silence is the correct output for a working screen: a permanent green
    // "connected" badge is one more thing on a screen that should be a list.
    expect(linkWords("live", 0)).toBeNull();
  });

  it("is quiet and hopeful about a blip", () => {
    expect(linkWords("slow", 12_000)).toContain("qayta ulanyapti");
  });

  it("names the consequence, not the cause", () => {
    const words = linkWords("lost", 4 * 60_000);

    // "Internet yo'q" on its own invites a shrug. What gets a phone picked up
    // is being told that calls are not arriving.
    expect(words).toContain("yangi chaqiruvlar ko'rinmayapti");
    expect(words).toContain("4 daqiqa");
  });
});
