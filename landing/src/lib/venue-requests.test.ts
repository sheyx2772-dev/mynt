import { describe, expect, it } from "vitest";

import { pointOf } from "./venue-requests";

describe("pointOf", () => {
  const points = ["Stol 1", "Stol 2", "VIP zal"];

  it("keeps a point the venue actually has", () => {
    expect(pointOf(points, "Stol 2")).toBe("Stol 2");
  });

  it("drops a number nobody printed", () => {
    expect(pointOf(points, "99")).toBeNull();
    expect(pointOf(points, "Stol 99")).toBeNull();
  });

  it("matches what a guest types back off a sticker", () => {
    // The number is read off the table as often as it is tapped, so case and
    // surrounding space cannot decide whether the waiter is called.
    expect(pointOf(points, " stol 2 ")).toBe("Stol 2");
    expect(pointOf(points, "VIP ZAL")).toBe("VIP zal");
  });

  it("answers with the venue's spelling, not the guest's", () => {
    expect(pointOf(points, "vip zal")).toBe("VIP zal");
  });

  it("has nothing to match against before the points are listed", () => {
    expect(pointOf([], "Stol 1")).toBeNull();
  });
});
