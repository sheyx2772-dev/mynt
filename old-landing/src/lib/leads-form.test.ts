import { describe, it, expect } from "vitest";
import { readLeadForm } from "./leads";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("readLeadForm", () => {
  it("accepts a name and a phone", () => {
    const result = readLeadForm(form({ name: "Javohir", phone: "+998 90 123 45 67" }));
    expect(result).toEqual({
      ok: true,
      lead: {
        name: "Javohir",
        phone: "+998 90 123 45 67",
        email: null,
        company: null,
        note: null,
      },
    });
  });

  it("lower-cases an email so the same person is not two rows", () => {
    const result = readLeadForm(form({ name: "A", email: "Javohir@Example.UZ" }));
    expect(result.ok && result.lead.email).toBe("javohir@example.uz");
  });

  it("refuses a submission with no way to answer it", () => {
    expect(readLeadForm(form({ name: "Javohir" }))).toEqual({
      ok: false,
      error: "Telefon yoki email — bittasi kerak.",
    });
  });

  // Typing a phone number wrong and being told nothing was entered would read
  // as the form losing the input.
  it("says the contact is wrong rather than missing when something was typed", () => {
    expect(readLeadForm(form({ name: "A", phone: "qongiroq qiling" }))).toEqual({
      ok: false,
      error: "Telefon yoki emailni tekshiring.",
    });
  });

  it("needs a name", () => {
    expect(readLeadForm(form({ phone: "+998901234567" }))).toEqual({
      ok: false,
      error: "Ismingizni yozing.",
    });
  });

  it("trims a note to what the column holds", () => {
    const result = readLeadForm(form({ name: "A", phone: "+998901234567", note: "x".repeat(700) }));
    expect(result.ok && result.lead.note).toHaveLength(500);
  });
});
