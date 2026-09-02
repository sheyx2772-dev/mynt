import { describe, it, expect } from "vitest";
import { shouldAdvance, nextScrollLeft, QUIET_MS } from "./carousel";

const NOW = 1_000_000;
const base = { hidden: false, reducedMotion: false, now: NOW, quietUntil: 0 };

describe("shouldAdvance", () => {
  it("moves when nothing says otherwise", () => {
    expect(shouldAdvance(base)).toBe(true);
  });

  it("never moves for somebody who asked for less motion", () => {
    expect(shouldAdvance({ ...base, reducedMotion: true })).toBe(false);
    // Even with everything else in its favour.
    expect(shouldAdvance({ ...base, reducedMotion: true, quietUntil: 0 })).toBe(false);
  });

  it("never moves while nobody is looking", () => {
    expect(shouldAdvance({ ...base, hidden: true })).toBe(false);
  });

  // The bug this replaced: a boolean set on pointerenter and cleared on
  // pointerleave stayed set when the leave never arrived, and the shelf stopped
  // for good. A deadline cannot fail to expire.
  it("holds still while a finger is on it, then goes on by itself", () => {
    const touched = NOW;
    const quietUntil = touched + QUIET_MS;

    expect(shouldAdvance({ ...base, now: touched + 1000, quietUntil })).toBe(false);
    expect(shouldAdvance({ ...base, now: touched + QUIET_MS - 1, quietUntil })).toBe(false);
    expect(shouldAdvance({ ...base, now: touched + QUIET_MS, quietUntil })).toBe(true);
    expect(shouldAdvance({ ...base, now: touched + 60_000, quietUntil })).toBe(true);
  });
});

describe("nextScrollLeft", () => {
  it("steps one card along", () => {
    expect(nextScrollLeft(0, 375, 954, 230)).toBe(230);
    expect(nextScrollLeft(230, 375, 954, 230)).toBe(460);
  });

  it("wraps to the start once the last card is in view", () => {
    expect(nextScrollLeft(579, 375, 954, 230)).toBe(0);
  });

  // Sub-pixel layout rarely lands on the exact end, so the wrap needs slack.
  it("treats a few pixels short of the end as the end", () => {
    expect(nextScrollLeft(576, 375, 954, 230)).toBe(0);
  });

  it("does not wrap while there is still a card to reach", () => {
    expect(nextScrollLeft(500, 375, 954, 230)).toBe(730);
  });
});
