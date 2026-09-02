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
