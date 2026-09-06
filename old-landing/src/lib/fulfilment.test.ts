import { describe, expect, it } from "vitest";

import {
  FULFILMENT_STATES,
  advanceLabel,
  canAdvance,
  fulfilmentForBuyer,
  fulfilmentLabel,
  isFulfilment,
  isOpen,
  nextStates,
  step,
  usualNext,
} from "@/lib/fulfilment";

describe("canAdvance", () => {
  it("lets a parcel move forward one step at a time", () => {
    expect(canAdvance("address_needed", "queued")).toBe(true);
    expect(canAdvance("queued", "making")).toBe(true);
    expect(canAdvance("making", "shipped")).toBe(true);
    expect(canAdvance("shipped", "delivered")).toBe(true);
  });

  it("refuses to make something before we know where it goes", () => {
    // The database enforces this too; here it is so the screen can grey the
    // button out rather than showing an error after the click.
    expect(canAdvance("address_needed", "making")).toBe(false);
    expect(canAdvance("address_needed", "shipped")).toBe(false);
  });

  it("refuses to skip making it", () => {
    expect(canAdvance("queued", "shipped")).toBe(false);
    expect(canAdvance("queued", "delivered")).toBe(false);
  });

  it("does not send a delivered parcel again", () => {
    expect(canAdvance("delivered", "shipped")).toBe(false);
    expect(canAdvance("delivered", "queued")).toBe(false);
  });

  it("lets a returned parcel go back in the queue", () => {
    // The one backwards move that happens in real life.
    expect(canAdvance("returned", "queued")).toBe(true);
  });

  it("lets one being made go back to the queue", () => {
    expect(canAdvance("making", "queued")).toBe(true);
  });

  it("never lets a state advance to itself", () => {
    for (const state of FULFILMENT_STATES) {
      expect(canAdvance(state, state)).toBe(false);
    }
  });
});

describe("usualNext", () => {
  it("offers the step the maker takes most", () => {
    expect(usualNext("address_needed")).toBe("queued");
    expect(usualNext("queued")).toBe("making");
    expect(usualNext("making")).toBe("shipped");
    expect(usualNext("shipped")).toBe("delivered");
  });

  it("agrees with what is allowed", () => {
    for (const state of FULFILMENT_STATES) {
      const next = usualNext(state);
      if (next) expect(canAdvance(state, next)).toBe(true);
    }
  });
});

describe("isOpen", () => {
  it("counts everything that still needs doing", () => {
    expect(isOpen("address_needed")).toBe(true);
    expect(isOpen("queued")).toBe(true);
    expect(isOpen("making")).toBe(true);
    expect(isOpen("shipped")).toBe(true);
    expect(isOpen("returned")).toBe(true);
  });

  it("stops counting once it has arrived", () => {
    expect(isOpen("delivered")).toBe(false);
  });
});

describe("step", () => {
  it("places each stage on the line", () => {
    expect(step("address_needed")).toEqual({ index: 1, of: 5 });
    expect(step("making")).toEqual({ index: 3, of: 5 });
    expect(step("delivered")).toEqual({ index: 5, of: 5 });
  });

  it("leaves a return off the scale", () => {
    // Drawing it as a stage would tell somebody their parcel is all the way to
    // being sent back.
    expect(step("returned")).toBeNull();
  });
});

describe("words", () => {
  it("says every state in every language", () => {
    for (const lang of ["uz", "ru", "en"] as const) {
      for (const state of FULFILMENT_STATES) {
        expect(fulfilmentLabel(state, lang)).toBeTruthy();
        expect(fulfilmentForBuyer(state, lang)).toBeTruthy();
      }
    }
  });

  it("labels the button for every state that can move", () => {
    for (const state of FULFILMENT_STATES) {
      const label = advanceLabel(state, "uz");
      expect(Boolean(label)).toBe(nextStates(state).length > 0);
    }
  });

  it("tells the buyer what is wanted from them, not what we call it", () => {
    // The queue says "Manzil kerak"; the person who has to type it is told to
    // type it.
    expect(fulfilmentLabel("address_needed", "uz")).toBe("Manzil kerak");
    expect(fulfilmentForBuyer("address_needed", "uz")).toContain("yozing");
  });
});

describe("isFulfilment", () => {
  it("accepts the states the database allows", () => {
    for (const state of FULFILMENT_STATES) expect(isFulfilment(state)).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isFulfilment("paid")).toBe(false);
    expect(isFulfilment("")).toBe(false);
    expect(isFulfilment(null)).toBe(false);
    expect(isFulfilment(3)).toBe(false);
  });
});
