import { describe, it, expect } from "vitest";

import { formatPhone, phoneDigits, MIN_PHONE_DIGITS } from "./phone";

describe("phoneDigits", () => {
  it("keeps the digits and drops everything else", () => {
    expect(phoneDigits("+998 90 123 45 67")).toBe("998901234567");
    expect(phoneDigits("(90) 123-45-67")).toBe("901234567");
  });

  // The value is echoed back to the reader and posted to the backend, so the
  // one thing it may never carry is anything that is not a digit.
  it("strips letters and markup rather than passing them through", () => {
    expect(phoneDigits("<b>998</b>90")).toBe("99890");
    expect(phoneDigits("abc")).toBe("");
  });

  // The cap is the longest number the SMS provider can reach, not the longest
  // number the standard allows. Fifteen let the field take four extra digits
  // and still look willing to send something to them.
  it("stops at twelve digits, which is 998 and a national number", () => {
    expect(phoneDigits("1".repeat(40))).toHaveLength(12);
    expect(phoneDigits("998 95 022 36 03 99")).toBe("998950223603");
  });
});

describe("formatPhone", () => {
  it("groups an Uzbek number the way it is written here", () => {
    expect(formatPhone("998901234567")).toBe("+998 90 123 45 67");
  });

  it("groups a partial number without inventing the missing digits", () => {
    expect(formatPhone("998")).toBe("+998");
    expect(formatPhone("99890")).toBe("+998 90");
    expect(formatPhone("998901")).toBe("+998 90 1");
  });

  it("shows a foreign number whole rather than in Uzbek groups", () => {
    expect(formatPhone("79161234567")).toBe("+79161234567");
  });

  // Hiding digits somebody typed is how a mistyped number looks correct — so
  // anything the grouping does not recognise is shown as it was typed, cap
  // included.
  it("shows a number it cannot group whole", () => {
    expect(formatPhone("12345678")).toBe("+12345678");
  });

  it("says nothing about an empty number", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("+")).toBe("");
  });
});

describe("MIN_PHONE_DIGITS", () => {
  it("is the length of a bare national number", () => {
    expect(MIN_PHONE_DIGITS).toBe(9);
    expect(phoneDigits("90 123 45 67")).toHaveLength(MIN_PHONE_DIGITS);
  });
});
