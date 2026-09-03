import { reasonFor, type Contact, type Reason, type Stage } from "@/lib/crm";

// What leaves this building, and what does not.
//
// The contacts in a card owner's list are other people's personal data. They
// were handed to one person at one meeting, not to us and not to a model
// vendor, so the assistant is built to be useful without ever learning who
// anybody is.
//
// Names, phone numbers and email addresses are never sent. Each contact becomes
// a reference — K1, K2 — and the answer comes back speaking in references,
// which this side maps to real people on the owner's own screen. The model can
// say "K3 has been waiting nine days" and be useful; it cannot say who K3 is,
// because it was never told.
//
// One honest limit, stated here rather than glossed: notes are free text and are
// sent as written, because they are the substance — "narx yubordim, javob yo'q"
// is the whole reason a contact needs chasing. A contact's own name is scrubbed
// out of their own notes, which removes the likeliest identifier, but a note
// naming a third party will carry that name. The screen says so before anything
// is sent.

export type BriefContact = {
  ref: string;
  company: string | null;
  stage: Stage;
  reason: Reason;
  /** Days since they first appeared. */
  age: number;
  /** Days since the owner last did anything about them, if ever. */
  quiet: number | null;
  /** Days until the diary entry; negative means it has passed. */
  due: number | null;
  tags: string[];
  /** What they said about themselves when they left their details. */
  said: string | null;
  /** What the owner wrote about them afterwards. */
  noted: string | null;
};

const DAY = 86_400_000;

function daysSince(iso: string, today: Date): number {
  return Math.max(0, Math.floor((today.getTime() - new Date(iso).getTime()) / DAY));
}

function dayOffset(isoDate: string, today: Date): number {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const then = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((then - now) / DAY);
}

/**
 * Take a person's own name out of the text written about them.
 *
 * Each part separately, so "Dilnoza Karimova" is removed whether the note says
 * the whole name or just "Dilnoza". Short fragments are left alone: a
 * two-letter surname particle would match half the words in a sentence and turn
 * the note into holes.
 */
export function scrubName(text: string, name: string): string {
  let out = text;

  for (const part of name.split(/\s+/).filter((p) => p.length >= 3)) {
    const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Bounded at the start of the word and open at the end.
    //
    // The start has to be bounded or "Ali" comes out of the middle of "Vali"
    // and leaves a hole in a sentence that was not about Ali. The end must not
    // be: Uzbek is agglutinative and a name in a note almost always carries a
    // case ending — Karimovaga, Dilnozadan, Bekzodning — so a trailing boundary
    // would fail to match a name in precisely the form it is usually written.
    //
    // The cost is that "Ali" also scrubs "Alisher", who is somebody else. That
    // is the right way round for this module to be wrong: over-scrubbing loses
    // a word from a note, under-scrubbing sends a person's name to a vendor.
    //
    // Spelled with Unicode letter classes rather than \b, which is defined on
    // [A-Za-z0-9_] and so recognises neither Cyrillic nor the apostrophes in
    // o' and g'. The preceding character is captured and put back rather than
    // using a lookbehind.
    out = out.replace(
      new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}[\\p{L}\\p{N}'’]*`, "giu"),
      "$1—",
    );
  }

  return out;
}

export type Redacted = {
  brief: BriefContact[];
  /** Reference back to the real row, kept on this side only. */
  back: Map<string, number>;
};

export function redact(
  contacts: readonly Contact[],
  today: Date = new Date(),
): Redacted {
  const brief: BriefContact[] = [];
  const back = new Map<string, number>();

  contacts.forEach((contact, index) => {
    const ref = `K${index + 1}`;
    back.set(ref, contact.id);

    brief.push({
      ref,
      // A company is the one identifying-ish field kept, because a network is
      // shaped by firms and an assistant that cannot see them can only count.
      company: contact.company?.trim() || null,
      stage: contact.stage,
      reason: reasonFor(contact, today),
      age: daysSince(contact.createdAt, today),
      quiet: contact.lastTouchAt ? daysSince(contact.lastTouchAt, today) : null,
      due: contact.followUpOn ? dayOffset(contact.followUpOn, today) : null,
      tags: contact.tags,
      said: contact.note ? scrubName(contact.note, contact.name) : null,
      noted: contact.ownerNote ? scrubName(contact.ownerNote, contact.name) : null,
    });
  });

  return { brief, back };
}

/**
 * Everything a direct identifier could be, for the test that proves none of it
 * is in what gets sent.
 *
 * Exported because the assertion belongs with the rule rather than in one test
 * file that somebody might not run.
 */
export function identifiersOf(contacts: readonly Contact[]): string[] {
  const out: string[] = [];
  for (const contact of contacts) {
    out.push(contact.name);
    if (contact.phone) out.push(contact.phone);
    if (contact.email) out.push(contact.email);
  }
  return out;
}
