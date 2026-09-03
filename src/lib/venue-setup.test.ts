import { describe, expect, it } from "vitest";

import { setupSteps, isSetUp, type SetupState } from "./venue-setup";

const WORDS = { listTitle: "Menyu", pointsTitle: "Stollar", pointPrefix: "Stol" };

const fresh: SetupState = { menuItems: 0, points: 0, hasStaffLink: false, requests: 0 };
const running: SetupState = { menuItems: 12, points: 8, hasStaffLink: true, requests: 3 };

describe("setupSteps", () => {
  it("puts them in the order they have to happen", () => {
    expect(setupSteps(fresh, WORDS).map((s) => s.key)).toEqual([
      "menu",
      "points",
      "staff",
      "first",
    ]);
  });

  it("ticks nothing on a venue opened a minute ago", () => {
    expect(setupSteps(fresh, WORDS).every((s) => !s.done)).toBe(true);
  });

  it("names each step in the venue's own words", () => {
    const hotel = setupSteps(fresh, {
      listTitle: "Xizmatlar",
      pointsTitle: "Xonalar",
      pointPrefix: "Xona",
    });

    expect(hotel[0]!.title).toBe("Xizmatlar");
    expect(hotel[1]!.title).toBe("Xonalar");
    // A hotel is told about rooms, not tables.
    expect(hotel[1]!.hint).toContain("xona");
  });

  it("says what is there once a step is done, not what to do", () => {
    const [menu] = setupSteps({ ...fresh, menuItems: 12 }, WORDS);
    expect(menu!.done).toBe(true);
    expect(menu!.hint).toBe("12 ta yozuv");
  });

  it("keeps pointing at printing while the tags exist but nothing has arrived", () => {
    const steps = setupSteps({ ...fresh, menuItems: 3, points: 8, hasStaffLink: true }, WORDS);
    expect(steps[1]!.hint).toContain("chop eting");
    expect(steps[3]!.done).toBe(false);
  });
});

describe("isSetUp", () => {
  it("is false until every step is done", () => {
    expect(isSetUp(fresh)).toBe(false);
    expect(isSetUp({ ...running, requests: 0 })).toBe(false);
    // A menu emptied later does not un-launch a venue that is already running,
    // but it does mean the panel comes back — which is correct: a venue with no
    // menu is not working, whatever it did last month.
    expect(isSetUp({ ...running, menuItems: 0 })).toBe(false);
  });

  it("is true once the loop has closed at least once", () => {
    expect(isSetUp(running)).toBe(true);
  });
});
