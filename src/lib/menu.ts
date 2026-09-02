import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Lang } from "@/lib/i18n";

// A venue's menu.
//
// The venue hangs off a claimed handle: a cafe buys one number, the number is
// on the table stand, and the menu lives at that address. Reads go through the
// public client because a menu printed on a stand is public by construction;
// writes go through the service role behind an ownership check, the same shape
// as every other edit in this codebase.

export type MenuItem = {
  id: string;
  categoryId: string | null;
  name: string;
  note: string | null;
  price: number;
  available: boolean;
  photoUrl: string | null;
  position: number;
};

export type MenuCategory = {
  id: string;
  name: string;
  position: number;
  items: MenuItem[];
};

export type Venue = {
  id: string;
  handleId: string;
  name: string;
  kind: "cafe" | "hotel" | "shop" | "other";
  hours: string | null;
  address: string | null;
  wifiName: string | null;
  /** Only ever read for the owner, or for a guest standing at a point. */
  wifiPassword: string | null;
  /** The tags: tables in a cafe, rooms in a hotel. Empty until printed. */
  points: string[];
};

/**
 * Picks the translation that exists.
 *
 * A cafe types its menu once, in the language it thinks in. Asking for three
 * versions of every dish before anything can be published would mean no menus
 * at all, so the other two are optional and this falls back rather than
 * showing an empty line.
 */
function pick(
  row: Record<string, unknown>,
  base: string,
  lang: Lang,
): string | null {
  const suffix = lang === "ru" ? "_ru" : lang === "en" ? "_en" : "";
  const translated = suffix ? (row[`${base}${suffix}`] as string | null) : null;
  return translated?.trim() || ((row[base] as string | null) ?? null);
}

/**
 * Looked up by the handle's text rather than its id.
 *
 * ClaimedProfile deliberately does not carry the row id — nothing public needs
 * it — and widening that type so this one call can skip a join would spread a
 * private key through every profile render.
 */
export async function getVenueByHandle(normalized: string): Promise<Venue | null> {
  if (!supabaseAdmin) return null;

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id")
    .eq("normalized", normalized)
    .maybeSingle();

  if (!handle) return null;

  const { data } = await supabaseAdmin
    .from("venues")
    .select("id, handle_id, name, kind, hours, address, wifi_name, wifi_password, points")
    .eq("handle_id", handle.id as string)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    handleId: data.handle_id as string,
    name: data.name as string,
    kind: data.kind as Venue["kind"],
    hours: (data.hours as string) ?? null,
    address: (data.address as string) ?? null,
    wifiName: (data.wifi_name as string) ?? null,
    wifiPassword: (data.wifi_password as string) ?? null,
    points: (data.points as string[]) ?? [],
  };
}

/**
 * The menu as a guest reads it.
 *
 * Sold-out dishes come back rather than being filtered out: seeing that the
 * lagman is off today is information, and a dish that silently vanishes reads
 * as a menu that never had it.
 */
export async function getMenu(venueId: string, lang: Lang): Promise<MenuCategory[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, name_ru, name_en, position")
      .eq("venue_id", venueId)
      .order("position")
      .order("created_at"),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, name, name_ru, name_en, note, note_ru, note_en, price, available, photo_url, position",
      )
      .eq("venue_id", venueId)
      .order("position")
      .order("created_at"),
  ]);

  const mapped: MenuItem[] = (items ?? []).map((row) => ({
    id: row.id as string,
    categoryId: (row.category_id as string) ?? null,
    name: pick(row, "name", lang) ?? "",
    note: pick(row, "note", lang),
    price: Number(row.price),
    available: Boolean(row.available),
    photoUrl: (row.photo_url as string) ?? null,
    position: Number(row.position),
  }));

  const groups: MenuCategory[] = (categories ?? []).map((row) => ({
    id: row.id as string,
    name: pick(row, "name", lang) ?? "",
    position: Number(row.position),
    items: mapped.filter((item) => item.categoryId === row.id),
  }));

  // Dishes with no category, or whose category was deleted, would otherwise
  // disappear from the page while still being on the menu.
  const loose = mapped.filter(
    (item) => !item.categoryId || !groups.some((g) => g.id === item.categoryId),
  );
  if (loose.length > 0) {
    groups.push({ id: "boshqa", name: "", position: 9999, items: loose });
  }

  return groups.filter((g) => g.items.length > 0);
}

/** The venue this user may edit, or null. Ownership is the query, as elsewhere. */
export async function getOwnedVenue(
  normalized: string,
  userId: string,
): Promise<Venue | null> {
  if (!supabaseAdmin) return null;

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("id")
    .eq("normalized", normalized)
    .eq("user_id", userId)
    .maybeSingle();

  if (!handle) return null;
  return getVenueByHandle(normalized);
}
