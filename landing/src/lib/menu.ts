import "server-only";

import type { Lang } from "@/lib/i18n";
import { asReader, backend } from "@/lib/backend/client";

// A venue and its menu.
//
// The translation fallback moved into Go with the query. A cafe types its menu
// once, in the language it thinks in; asking for three versions of every dish
// before anything can be published would mean no menus at all. So the backend
// picks the translation that exists and this file receives one language.

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
  name: string;
  kind: "cafe" | "hotel" | "shop" | "other";
  hours: string | null;
  address: string | null;
  wifiName: string | null;
  /** Only ever sent to the owner, or to a guest standing at a point. */
  wifiPassword: string | null;
  /** The tags: tables in a cafe, rooms in a hotel. Empty until printed. */
  points: string[];
  /** The secret in the counter link. Owner only, and never on a menu. */
  staffToken: string | null;
  planExpiresAt: string | null;
};

type BackendVenue = {
  id: string;
  nom: string;
  turi: "cafe" | "hotel" | "shop" | "other";
  ish_vaqti?: string;
  manzil?: string;
  wifi?: string;
  wifi_paroli?: string;
  nuqtalar?: string[] | null;
  xodim_kaliti?: string;
  tarif_tugashi?: string;
};

function toVenue(v: BackendVenue): Venue {
  return {
    id: v.id,
    name: v.nom,
    kind: v.turi,
    hours: v.ish_vaqti ?? null,
    address: v.manzil ?? null,
    wifiName: v.wifi ?? null,
    wifiPassword: v.wifi_paroli ?? null,
    points: v.nuqtalar ?? [],
    staffToken: v.xodim_kaliti ?? null,
    planExpiresAt: v.tarif_tugashi ?? null,
  };
}

type BackendCategory = {
  id: string;
  nom: string;
  tartib: number;
  taomlar?:
    | {
        id: string;
        bolim?: string;
        nom: string;
        izoh?: string;
        narx: number;
        bor: boolean;
        rasm?: string;
        tartib: number;
      }[]
    | null;
};

function toCategory(c: BackendCategory): MenuCategory {
  return {
    id: c.id,
    name: c.nom,
    position: c.tartib,
    items: (c.taomlar ?? []).map((i) => ({
      id: i.id,
      categoryId: i.bolim ?? null,
      name: i.nom,
      note: i.izoh ?? null,
      price: i.narx,
      available: i.bor,
      photoUrl: i.rasm ?? null,
      position: i.tartib,
    })),
  };
}

/** The venue on a public profile. No secrets: this is what a guest sees. */
export async function getVenueByHandle(handle: string): Promise<Venue | null> {
  const { data, error } = await backend.GET("/profil/{raqam}/menyu", {
    params: { path: { raqam: handle }, query: { til: "uz" } },
  });
  return error || !data ? null : toVenue(data.obyekt);
}

/** The menu, in one language, grouped as it is drawn. */
export async function getMenu(handle: string, lang: Lang = "uz"): Promise<MenuCategory[]> {
  const { data, error } = await backend.GET("/profil/{raqam}/menyu", {
    params: { path: { raqam: handle }, query: { til: lang } },
  });
  if (error || !data) return [];

  return (data.bolimlar ?? []).map(toCategory);
}

/** The venue as its owner, secrets and all. */
export async function getOwnedVenue(handle: string): Promise<Venue | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/obyekt", {
    params: { path: { raqam: handle } },
  });
  return error || !data ? null : toVenue(data.obyekt);
}

export type StaffScreen = { venue: Venue; handle: string };

/**
 * The venue behind a counter link.
 *
 * The token is the whole credential, so a miss is the same 404 a made-up token
 * gets. Nothing about the owner comes back — the counter screen shows a name
 * and a list of requests, and that is all it is allowed to know.
 */
export async function getVenueByStaffToken(token: string): Promise<StaffScreen | null> {
  const { data, error } = await backend.GET("/xodim/{kalit}", {
    params: { path: { kalit: token } },
  });
  if (error || !data) return null;

  return { venue: toVenue(data.obyekt), handle: data.obyekt.raqam ?? "" };
}

export async function countMenuItems(handle: string): Promise<number> {
  const categories = await getMenu(handle);
  return categories.reduce((total, c) => total + c.items.length, 0);
}

export type EditableItem = MenuItem & {
  nameRu: string;
  nameEn: string;
  noteRu: string;
  noteEn: string;
};

/**
 * One row, for the screen that edits it.
 *
 * Every translation comes back rather than one: an editor shown a single
 * language would overwrite the other two with blanks the first time somebody
 * saved.
 */
export async function getMenuItem(id: string): Promise<EditableItem | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/menyu/taomlar/{id}", {
    params: { path: { id } },
  });
  if (error || !data) return null;

  const i = data.taom;
  return {
    id: i.id,
    categoryId: i.bolim ?? null,
    name: i.nom,
    note: i.izoh ?? null,
    price: i.narx,
    available: i.bor,
    photoUrl: i.rasm ?? null,
    position: i.tartib,
    nameRu: i.nom_ru ?? "",
    nameEn: i.nom_en ?? "",
    noteRu: i.izoh_ru ?? "",
    noteEn: i.izoh_en ?? "",
  };
}

export type EditableCategory = { id: string; name: string; nameRu: string; nameEn: string };

export async function getMenuCategory(id: string): Promise<EditableCategory | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/menyu/bolimlar/{id}", {
    params: { path: { id } },
  });
  if (error || !data) return null;

  const c = data.bolim;
  return { id: c.id, name: c.nom, nameRu: c.nom_ru ?? "", nameEn: c.nom_en ?? "" };
}
