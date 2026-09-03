import "server-only";

import { randomBytes } from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { uploadImage, isStorageConfigured } from "@/lib/storage";
import { checkDishPhoto } from "@/lib/uploads";

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

/**
 * The photograph on one row of the menu.
 *
 * Optional everywhere, because a cafe types its menu on the day it gets the
 * tags and photographs it over the following week — a form that will not save
 * without a picture is a menu that never gets published.
 *
 * Returns undefined when there is nothing to do, which is different from null:
 * null is "take the picture off", undefined is "leave whatever is there".
 */
async function readPhoto(
  venueId: string,
  file: FormDataEntryValue | null,
): Promise<{ url: string | null } | { error: string } | undefined> {
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (!isStorageConfigured) return { error: "Rasm saqlash hozircha ulanmagan." };

  const check = checkDishPhoto(file);
  if (!check.ok) return { error: check.error };

  const key = `menyu/${venueId}/${crypto.randomUUID()}.${check.extension}`;
  const url = await uploadImage(
    key,
    Buffer.from(await file.arrayBuffer()),
    check.contentType,
  );

  return url ? { url } : { error: "Rasmni yuklab bo'lmadi." };
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

  const photo = await readPhoto(venueId, form.get("photo"));
  if (photo && "error" in photo) return { ok: false, error: photo.error };

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
    photo_url: photo?.url ?? null,
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

/**
 * Makes, or replaces, the counter link.
 *
 * Replacing is the revoke: there is one token, so writing a new one ends every
 * phone that had the old one, which is what an owner wants the moment a waiter
 * leaves or a link is forwarded somewhere it should not have gone. There is no
 * separate "revoke" for the same reason there is no list of issued links — one
 * venue, one address, and pressing the button is the whole story.
 *
 * 128 bits from the system generator. It is the entire credential, so it has to
 * be worth as much as a password nobody will ever type.
 */
export async function rotateStaffToken(venueId: string): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi." };

  const token = randomBytes(16).toString("hex");

  const { error } = await supabaseAdmin
    .from("venues")
    .update({ staff_token: token })
    .eq("id", venueId);

  if (error) return { ok: false, error: "Saqlab bo'lmadi." };
  return { ok: true };
}

/**
 * Putting a photograph on a dish that is already on the menu, or taking it off.
 *
 * Separate from addItem because that is the shape of the work: the menu is
 * typed in one sitting and photographed over the following week, one dish at a
 * time, by somebody walking around with a phone.
 */
export async function setItemPhoto(
  venueId: string,
  itemId: string,
  form: FormData,
): Promise<EditResult> {
  if (!supabaseAdmin) return { ok: false, error: "Saqlab bo'lmadi." };

  const remove = form.get("remove") === "1";
  const photo = remove ? { url: null } : await readPhoto(venueId, form.get("photo"));

  if (photo && "error" in photo) return { ok: false, error: photo.error };
  if (!photo) return { ok: false, error: "Rasm tanlanmadi." };

  // The old file is left in the bucket rather than deleted. A dish photo is
  // small, deleting is the one operation that cannot be undone by re-uploading,
  // and a menu page cached on a guest's phone would otherwise show a hole.
  const { error } = await supabaseAdmin
    .from("menu_items")
    .update({ photo_url: photo.url })
    .eq("id", itemId)
    .eq("venue_id", venueId);

  if (error) return { ok: false, error: "Saqlab bo'lmadi." };
  return { ok: true };
}
