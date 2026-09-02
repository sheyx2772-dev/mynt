import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

// Writing a menu.
//
// Ownership is the query, as everywhere else here: every statement carries the
// venue id that was resolved from the signed-in user's own handle, so a forged
// id in a form field matches no rows rather than editing somebody else's cafe.

export type EditResult = { ok: true } | { ok: false; error: string };

const NAME_MAX = 120;
const NOTE_MAX = 200;
const PRICE_MAX = 100_000_000;

function text(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

/** Empty means "not translated", which the reader falls back for. */
function optional(value: FormDataEntryValue | null, max: number): string | null {
  return text(value, max) || null;
}

export async function addCategory(venueId: string, form: FormData): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi." };

  const name = text(form.get("name"), 60);
  if (!name) return { ok: false, error: "Bo'lim nomini kiriting." };

  const { count } = await supabaseAdmin
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId);

  const { error } = await supabaseAdmin.from("menu_categories").insert({
    venue_id: venueId,
    name,
    name_ru: optional(form.get("name_ru"), 60),
    name_en: optional(form.get("name_en"), 60),
    position: count ?? 0,
  });

  if (error) return { ok: false, error: "Saqlab bo'lmadi." };
  return { ok: true };
}

export async function removeCategory(venueId: string, categoryId: string): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "O'chirib bo'lmadi." };

  // The dishes survive it — the foreign key sets their category to null and
  // the reader shows them ungrouped. Deleting a heading should not delete a
  // morning's typing.
  const { error } = await supabaseAdmin
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("venue_id", venueId);

  if (error) return { ok: false, error: "O'chirib bo'lmadi." };
  return { ok: true };
}

export async function addItem(venueId: string, form: FormData): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi." };

  const name = text(form.get("name"), NAME_MAX);
  if (!name) return { ok: false, error: "Taom nomini kiriting." };

  // Typed by somebody who thinks in "38 000", not in digits.
  const price = Number.parseInt(text(form.get("price"), 20).replace(/\D/g, ""), 10);
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Narxni kiriting." };
  if (price > PRICE_MAX) return { ok: false, error: "Narx juda katta." };

  const categoryId = text(form.get("category_id"), 40) || null;

  const { count } = await supabaseAdmin
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId)
    .eq("category_id", categoryId ?? "");

  const { error } = await supabaseAdmin.from("menu_items").insert({
    venue_id: venueId,
    category_id: categoryId,
    name,
    name_ru: optional(form.get("name_ru"), NAME_MAX),
    name_en: optional(form.get("name_en"), NAME_MAX),
    note: optional(form.get("note"), NOTE_MAX),
    price,
    position: count ?? 0,
  });

  if (error) return { ok: false, error: "Saqlab bo'lmadi." };
  return { ok: true };
}

export async function setItemAvailable(
  venueId: string,
  itemId: string,
  available: boolean,
): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi." };

  const { error } = await supabaseAdmin
    .from("menu_items")
    .update({ available })
    .eq("id", itemId)
    .eq("venue_id", venueId);

  if (error) return { ok: false, error: "Saqlab bo'lmadi." };
  return { ok: true };
}

export async function removeItem(venueId: string, itemId: string): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "O'chirib bo'lmadi." };

  const { error } = await supabaseAdmin
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("venue_id", venueId);

  if (error) return { ok: false, error: "O'chirib bo'lmadi." };
  return { ok: true };
}

export async function saveVenue(venueId: string, form: FormData): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi." };

  const name = text(form.get("name"), 120);
  if (name.length < 2) return { ok: false, error: "Obyekt nomini kiriting." };

  const { error } = await supabaseAdmin
    .from("venues")
    .update({
      name,
      hours: optional(form.get("hours"), 120),
      address: optional(form.get("address"), 200),
      wifi_name: optional(form.get("wifi_name"), 60),
      wifi_password: optional(form.get("wifi_password"), 60),
    })
    .eq("id", venueId);

  if (error) return { ok: false, error: "Saqlab bo'lmadi." };
  return { ok: true };
}

/**
 * Turning a number into a place.
 *
 * Until now a venue row could only be written by hand, which meant the whole
 * business product — the menu, the service list, the requests — was reachable
 * only for a cafe somebody set up from a terminal. A hotel that buys a number
 * on Monday has to be able to open it on Monday.
 *
 * The handle is resolved with the ownership filter in the same statement, so a
 * forged handle creates nothing rather than attaching a venue to somebody
 * else's number.
 */
export async function createVenue(
  normalized: string,
  userId: string,
  form: FormData,
): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi." };

  const name = text(form.get("name"), 120);
  if (name.length < 2) return { ok: false, error: "Obyekt nomini kiriting." };

  const kind = text(form.get("kind"), 10);
  if (!["cafe", "hotel", "shop", "other"].includes(kind)) {
    return { ok: false, error: "Obyekt turini tanlang." };
  }

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id")
    .eq("normalized", normalized)
    .eq("user_id", userId)
    .eq("status", "claimed")
    .maybeSingle();

  if (!handle) return { ok: false, error: "Bu raqam sizniki emas." };

  // One venue per number, enforced by a unique constraint on handle_id. A
  // second attempt is somebody double-tapping, not a new building.
  const { error } = await supabaseAdmin.from("venues").insert({
    handle_id: handle.id as string,
    name,
    kind,
  });

  if (error) return { ok: false, error: "Obyekt allaqachon ochilgan." };
  return { ok: true };
}

/**
 * The list of tags this venue prints.
 *
 * Typed as one block of text — a line or a comma per tag — because that is how
 * somebody holds the list in their head ("1 dan 12 gacha, terrasa 1, terrasa
 * 2") and because saving is then one replacement rather than a screen of rows
 * with their own add, rename and reorder controls.
 *
 * Renaming here never touches requests: those keep the label they were made
 * with, since it is the label printed on a sticker that may still be on a
 * table.
 */
export async function savePoints(venueId: string, form: FormData): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi." };

  const seen = new Set<string>();
  const points: string[] = [];

  for (const part of String(form.get("points") ?? "").split(/[\n,;]+/)) {
    // The same characters the QR route allows, so what is printed and what is
    // scanned cannot disagree.
    const label = part.replace(/[^\p{L}\p{N} .\-]/gu, "").trim().slice(0, 12);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    points.push(label);
  }

  if (points.length > 500) return { ok: false, error: "500 tadan ko'p bo'lmasin." };

  const { error } = await supabaseAdmin
    .from("venues")
    .update({ points })
    .eq("id", venueId);

  if (error) return { ok: false, error: "Saqlab bo'lmadi." };
  return { ok: true };
}
