import "server-only";

import { asReader } from "@/lib/backend/client";

import { isStage, type Contact, type Stage } from "@/lib/crm";
import type { ResolvedBrief } from "@/lib/ai/network-brief";

// Reading and working the contact list.
//
// Ownership is the query throughout, as everywhere else here: the handle is
// resolved from the signed-in user first and every statement carries the id
// that came back, so a forged one matches no rows rather than reading somebody
// else's meetings.

const COLUMNS =
  "id, name, phone, email, company, note, owner_note, status, tags, " +
  "follow_up_on, last_touch_at, source, created_at";

type Row = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  note: string | null;
  owner_note: string | null;
  status: string;
  tags: string[] | null;
  follow_up_on: string | null;
  last_touch_at: string | null;
  source: string | null;
  created_at: string;
};

function toContact(raw: unknown): Contact {
  const row = raw as Row;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    company: row.company,
    note: row.note,
    ownerNote: row.owner_note,
    stage: (isStage(row.status) ? row.status : "new") as Stage,
    tags: row.tags ?? [],
    followUpOn: row.follow_up_on,
    lastTouchAt: row.last_touch_at,
    source: row.source as Contact["source"],
    createdAt: row.created_at,
  };
}

/** The handle's row id, but only if this user owns it. */
/**
 * Everyone this number has collected.
 *
 * Unordered on purpose: the order is crm.ts's opinion and belongs where it can
 * be tested, not in a query somebody would have to read SQL to understand.
 */
export async function listContacts(handle: string): Promise<Contact[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/vizitkalar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.vizitkalar ?? []).map((l) => ({
    id: l.id,
    name: l.ism,
    phone: l.telefon ?? null,
    email: l.email ?? null,
    company: l.kompaniya ?? null,
    note: l.izoh ?? null,
    source: l.manba ?? null,
    createdAt: l.vaqt,
    stage: (l.holat ?? "new") as Stage,
    ownerNote: l.oz_izoh ?? null,
    followUpOn: l.eslatma ?? null,
    lastTouchAt: l.oxirgi_teginish ?? null,
    tags: l.teglar ?? [],
  }));
}

export type ContactPatch = {
  stage?: Stage;
  ownerNote?: string | null;
  followUpOn?: string | null;
  tags?: string[];
};

/**
 * Change the owner's own side of one contact.
 *
 * The contact itself — the name and number somebody left — is not editable.
 * It is a record of what was said rather than a field.
 *
 * `last_touch_at` is not sent: a trigger stamps it from the same statement, so
 * the clock cannot disagree with the change that moved it.
 */
export async function updateContact(
  handle: string,
  id: number,
  patch: ContactPatch,
): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.PATCH("/raqamlar/{raqam}/vizitkalar/{id}", {
    params: { path: { raqam: handle, id } },
    body: {
      holat: patch.stage,
      izoh: patch.ownerNote ?? undefined,
      eslatma: patch.followUpOn ?? undefined,
      teglar: patch.tags,
    },
  });
  return !error;
}

/** Somebody the owner met and typed in, rather than one who filled in the form. */
export type NewContact = {
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  note?: string | null;
};

export async function addContact(handle: string, contact: NewContact): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.POST("/raqamlar/{raqam}/vizitkalar", {
    params: { path: { raqam: handle } },
    body: {
      ism: contact.name,
      telefon: contact.phone ?? undefined,
      email: contact.email ?? undefined,
      kompaniya: contact.company ?? undefined,
      izoh: contact.note ?? undefined,
    },
  });
  return !error;
}

export type StoredSuggestion = { ref: string; why: string; draft: string; contactId: number };

export type StoredBrief = {
  summary: string;
  /**
   * What the brief suggested, by contact id.
   *
   * Stored as text and parsed here: the shape belongs to the page that builds
   * it, and a column that has to be migrated every time that page changes is
   * a column in the wrong place. Anything extra the builder puts on a
   * suggestion travels with it.
   */
  suggestions: StoredSuggestion[];
  contactsSeen: number;
  builtAt: string;
};

export async function getBrief(handle: string): Promise<StoredBrief | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/xulosa", {
    params: { path: { raqam: handle } },
  });
  if (error || !data?.xulosa) return null;

  const b = data.xulosa;
  return {
    summary: b.xulosa,
    // Stored as text and parsed here: the shape is this page's business, and
    // a column that has to be migrated every time the page changes shape is a
    // column in the wrong place.
    suggestions: safeParse(b.takliflar),
    contactsSeen: b.korilgan,
    builtAt: b.tuzilgan ?? "",
  };
}

function safeParse(raw: string): StoredBrief["suggestions"] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Keeping a brief so the page does not rebuild it on every visit.
 *
 * A suggestion is stored by contact id rather than with the contact in it: the
 * contact may change between builds, and a stale copy of somebody's phone
 * number inside a saved summary is worse than a lookup.
 */
export async function saveBrief(
  handle: string,
  brief: { summary: string; suggestions: ResolvedBrief["suggestions"]; contactsSeen: number },
): Promise<void> {
  const client = await asReader();
  await client.PUT("/raqamlar/{raqam}/xulosa", {
    params: { path: { raqam: handle } },
    body: {
      xulosa: brief.summary.slice(0, 4000),
      takliflar: JSON.stringify(
        brief.suggestions.map((s) => ({
          ref: s.ref,
          why: s.why,
          draft: s.draft,
          contactId: s.contact.id,
        })),
      ),
      korilgan: brief.contactsSeen,
    },
  });
}

export async function deleteBrief(handle: string): Promise<void> {
  const client = await asReader();
  await client.DELETE("/raqamlar/{raqam}/xulosa", {
    params: { path: { raqam: handle } },
  });
}
