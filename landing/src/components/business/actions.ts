"use server";

import { backend } from "@/lib/backend/client";
import { isDirection } from "./venues";

/**
 * What went wrong, as something the page can translate.
 *
 * A code rather than a sentence: this form is rendered in three languages and
 * the words belong in the message files. It is also the only thing the caller
 * is told. The backend's status, its problem document and whatever the network
 * said stay on the server — an open form that prints "connect ECONNREFUSED
 * 10.0.0.4:8090" is a form that maps our network for anyone who asks it to.
 */
export type EnquiryError =
  "company" | "name" | "phone" | "points" | "pointsBig" | "note" | "save";

export type EnquiryState = { sent?: true; error?: EnquiryError };

/** A typo guard, and the largest venue we will take as an answer. */
const MAX_POINTS = 100_000;

/**
 * A venue or a company asks to be called back.
 *
 * Nothing here is authenticated and nothing here should be: a cafe owner
 * pricing a menu has no account yet, and `/jamoa/sorov` is published as the
 * one endpoint that takes a stranger. That makes every field below an
 * untrusted string, so each is validated and cut to length here rather than in
 * the browser — `required` and `maxlength` are a courtesy to the person
 * filling the form in, not a control, and a poster who skips the page skips
 * them too.
 *
 * The direction is not passed through as typed. It is matched against the list
 * the page itself offers and falls back to "other", because this value is read
 * later by a person in a panel, and a field rendered to somebody else is
 * rebuilt from validated parts.
 *
 * There is no user id in the body, and there must not be one: the request
 * names a company and a phone number, and any claim about who is sending it
 * would be a claim the sender made about themselves.
 */
export async function sendEnquiry(
  _previous: EnquiryState,
  form: FormData,
): Promise<EnquiryState> {
  const company = text(form, "company", 120);
  if (company.length < 2) return { error: "company" };

  const name = text(form, "name", 80);
  if (name.length < 2) return { error: "name" };

  const phone = text(form, "phone", 32);
  // Counted, not pattern-matched. People write +998 90 123 45 67, 90-123-45-67
  // and 998901234567, and all three are the same number.
  if ((phone.match(/\d/g)?.length ?? 0) < 9) return { error: "phone" };

  const points = Number(text(form, "points", 8));
  if (!Number.isInteger(points) || points < 1) return { error: "points" };
  if (points > MAX_POINTS) return { error: "pointsBig" };

  // Said rather than silently trimmed: somebody who wrote three paragraphs
  // should be told they were cut, not discover it in the reply.
  const note = String(form.get("note") ?? "").trim();
  if (note.length > 1000) return { error: "note" };

  const raw = form.get("direction");
  const direction = isDirection(raw) ? raw : "other";

  try {
    const { error } = await backend.POST("/jamoa/sorov", {
      body: {
        kompaniya: company,
        ism: name,
        telefon: phone,
        nuqtalar: points,
        yonalish: direction,
        ...(note ? { izoh: note } : {}),
      },
    });
    if (error) return { error: "save" };
  } catch (cause) {
    // Logged where it can be read, answered with a phone number where it
    // cannot. A lead form that dead-ends loses the lead.
    console.error("enquiry", cause);
    return { error: "save" };
  }

  return { sent: true };
}

function text(form: FormData, field: string, max: number): string {
  return String(form.get(field) ?? "")
    .trim()
    .slice(0, max);
}
