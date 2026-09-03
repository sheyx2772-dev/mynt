import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
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
async function ownedHandleId(
  normalized: string,
  userId: string,
): Promise<string | null> {
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from("handles")
    .select("id")
    .eq("normalized", normalized)
    .eq("user_id", userId)
    .maybeSingle();

  return data?.id ?? null;
}

/**
 * Everyone this number has collected.
 *
 * Unordered on purpose: the order is crm.ts's opinion and belongs where it can
 * be tested, not in a query somebody would have to read SQL to understand.
 */
export async function listContacts(
  normalized: string,
  userId: string,
): Promise<Contact[]> {
  if (!supabaseAdmin) return [];

  const handleId = await ownedHandleId(normalized, userId);
  if (!handleId) return [];

  const { data } = await supabaseAdmin
    .from("leads")
    .select(COLUMNS)
    .eq("handle_id", handleId)
    .order("created_at", { ascending: false })
    .limit(1000);

  return (data ?? []).map(toContact);
}

export type ContactPatch = {
  stage?: Stage;
  ownerNote?: string | null;
  followUpOn?: string | null;
  tags?: string[];
};

/**
 * Change the owner's side of one contact.
 *
 * `last_touch_at` is deliberately not set here. A database trigger stamps it
 * from the same statement, so the clock cannot disagree with the change that
 * moved it — see migration 0044.
 */
export async function updateContact(
  normalized: string,
  userId: string,
  contactId: number,
  patch: ContactPatch,
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const handleId = await ownedHandleId(normalized, userId);
  if (!handleId) return false;

  const fields: Record<string, unknown> = {};
  if (patch.stage) fields.status = patch.stage;
  if (patch.ownerNote !== undefined) fields.owner_note = patch.ownerNote;
  if (patch.followUpOn !== undefined) fields.follow_up_on = patch.followUpOn;
  if (patch.tags) fields.tags = patch.tags.slice(0, 5);
  if (Object.keys(fields).length === 0) return false;

  const { data } = await supabaseAdmin
    .from("leads")
    .update(fields)
    .eq("id", contactId)
    .eq("handle_id", handleId)
    .select("id")
    .maybeSingle();

  return Boolean(data);
}

/** A number taken on paper, entered by the owner. */
export async function addContact(
  normalized: string,
  userId: string,
  input: { name: string; phone: string | null; email: string | null; company: string | null },
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const handleId = await ownedHandleId(normalized, userId);
  if (!handleId) return false;

  const { data } = await supabaseAdmin
    .from("leads")
    .insert({
      handle_id: handleId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      company: input.company,
      source: "manual",
    })
    .select("id")
    .maybeSingle();

  return Boolean(data);
}

export type StoredBrief = {
  summary: string;
  suggestions: { ref: string; why: string; draft: string; contactId: number }[];
  contactsSeen: number;
  builtAt: string;
};

export async function getBrief(
  normalized: string,
  userId: string,
): Promise<StoredBrief | null> {
  if (!supabaseAdmin) return null;

  const handleId = await ownedHandleId(normalized, userId);
  if (!handleId) return null;

  const { data } = await supabaseAdmin
    .from("network_briefs")
    .select("summary, suggestions, contacts_seen, built_at")
    .eq("handle_id", handleId)
    .maybeSingle();

  if (!data) return null;

  return {
    summary: data.summary as string,
    suggestions: (data.suggestions ?? []) as StoredBrief["suggestions"],
    contactsSeen: (data.contacts_seen ?? 0) as number,
    builtAt: data.built_at as string,
  };
}

/** Replaces whatever was there. Nobody wants last Tuesday's briefing. */
export async function saveBrief(
  normalized: string,
  userId: string,
  brief: ResolvedBrief,
  contactsSeen: number,
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const handleId = await ownedHandleId(normalized, userId);
  if (!handleId) return false;

  const { error } = await supabaseAdmin.from("network_briefs").upsert(
    {
      handle_id: handleId,
      summary: brief.summary.slice(0, 4000),
      suggestions: brief.suggestions.map((s) => ({
        ref: s.ref,
        why: s.why,
        draft: s.draft,
        contactId: s.contact.id,
      })),
      contacts_seen: contactsSeen,
      built_at: new Date().toISOString(),
    },
    { onConflict: "handle_id" },
  );

  return !error;
}

export async function deleteBrief(
  normalized: string,
  userId: string,
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const handleId = await ownedHandleId(normalized, userId);
  if (!handleId) return false;

  const { error } = await supabaseAdmin
    .from("network_briefs")
    .delete()
    .eq("handle_id", handleId);

  return !error;
}
