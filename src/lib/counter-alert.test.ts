import { describe, expect, it } from "vitest";

import { decideAlert } from "./counter-alert";

describe("decideAlert", () => {
  it("says nothing about the backlog already on screen when it opens", () => {
    const { fresh, ring } = decideAlert(new Set(), ["a", "b", "c"], false);
    expect(fresh).toEqual(["a", "b", "c"]);
    expect(ring).toBe(false);
  });

  it("rings for a request that was not there a moment ago", () => {
    expect(decideAlert(new Set(["a"]), ["b", "a"], true)).toEqual({
      fresh: ["b"],
      ring: true,
    });
  });

  it("stays quiet when the list has not changed", () => {
    expect(decideAlert(new Set(["a", "b"]), ["a", "b"], true).ring).toBe(false);
  });

  it("stays quiet when a request is closed", () => {
    // The waiter answered table 7; the list got shorter, which is not an event.
    expect(decideAlert(new Set(["a", "b"]), ["a"], true).ring).toBe(false);
  });

  it("does not ring twice for the same request", () => {
    const first = decideAlert(new Set(["a"]), ["b", "a"], true);
    expect(first.ring).toBe(true);

    const seen = new Set(["a", ...first.fresh]);
    expect(decideAlert(seen, ["b", "a"], true).ring).toBe(false);
  });

  it("rings again if a closed request is reopened", () => {
    // Reopening writes no new row, so the id comes back — and a table that is
    // waiting again is waiting again.
    const seen = new Set(["a"]);
    expect(decideAlert(seen, ["b"], true).ring).toBe(true);
  });
});
