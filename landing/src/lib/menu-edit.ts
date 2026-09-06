"use server";

import { revalidatePath } from "next/cache";

import { asReader } from "@/lib/backend/client";
import { getMenu } from "@/lib/menu";
import { uploadImage, isStorageConfigured } from "@/lib/storage";

// Changing a venue and its menu.
//
// Every one of these is a form post from the cabinet. The checks that used to
// be here — does this section belong to this venue, does this venue belong to
// this person — are in the statements behind the backend now, joined through
// `handles`. What is left is reading a form and saying what went wrong.

export type EditResult = { ok: true } | { ok: false; error: string };

const FAILED: EditResult = { ok: false, error: "Saqlanmadi. Internetni tekshirib, yana urinib ko'ring." };

function text(value: FormDataEntryValue | null, limit: number): string {
  return String(value ?? "").trim().slice(0, limit);
}

/** The three languages a field may be typed in. Only the first is required. */
function names(form: FormData, base: string, limit = 60) {
  return {
    uz: text(form.get(base), limit),
    ru: text(form.get(`${base}_ru`), limit),
    en: text(form.get(`${base}_en`), limit),
  };
}

function refresh(handle: string) {
  revalidatePath(`/kabinet/${handle}/menyu`);
  revalidatePath(`/${handle}`);
}

export async function addCategory(handle: string, form: FormData): Promise<EditResult> {
  const nom = names(form, "name");
  if (!nom.uz) return { ok: false, error: "Bo'lim nomini kiriting." };

  const client = await asReader();
  const { error } = await client.POST("/raqamlar/{raqam}/menyu/bolimlar", {
    params: { path: { raqam: handle } },
    body: { nom },
  });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

export async function editCategory(
  handle: string,
  id: string,
  form: FormData,
): Promise<EditResult> {
  const nom = names(form, "name");
  if (!nom.uz) return { ok: false, error: "Bo'lim nomini kiriting." };

  const client = await asReader();
  const { error } = await client.PUT("/menyu/bolimlar/{id}", {
    params: { path: { id } },
    body: { nom },
  });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

/**
 * Deleting a section.
 *
 * Every dish under it drops out into "uncategorised" rather than going with
 * it, which is why renaming exists at all: a typo in a heading used to cost an
 * afternoon of reassigning dishes one by one.
 */
export async function removeCategory(handle: string, id: string): Promise<EditResult> {
  const client = await asReader();
  const { error } = await client.DELETE("/menyu/bolimlar/{id}", { params: { path: { id } } });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

/**
 * Moving a section up or down.
 *
 * A direction rather than a position, because that is what the button says.
 * The two rows swap positions, which is two writes — done here rather than in
 * SQL because the list is already on screen and the alternative is a stored
 * procedure for reordering a menu.
 */
export async function moveCategory(
  handle: string,
  id: string,
  direction: "up" | "down",
): Promise<EditResult> {
  const menu = await getMenu(handle);
  const at = menu.findIndex((c) => c.id === id);
  const to = direction === "up" ? at - 1 : at + 1;
  if (at < 0 || to < 0 || to >= menu.length) return { ok: true };

  const client = await asReader();
  const move = (target: string, tartib: number) =>
    client.PUT("/menyu/bolimlar/{id}/tartib", {
      params: { path: { id: target } },
      body: { tartib },
    });

  const [a, b] = await Promise.all([
    move(menu[at].id, menu[to].position),
    move(menu[to].id, menu[at].position),
  ]);
  if (a.error || b.error) return FAILED;

  refresh(handle);
  return { ok: true };
}

function itemBody(form: FormData) {
  return {
    bolim: text(form.get("category_id"), 40) || undefined,
    nom: names(form, "name"),
    izoh: names(form, "note", 200),
    // A price typed with spaces is how it is written here.
    narx: Number(text(form.get("price"), 12).replace(/\D/g, "")) || 0,
  };
}

export async function addItem(handle: string, form: FormData): Promise<EditResult> {
  const body = itemBody(form);
  if (!body.nom.uz) return { ok: false, error: "Taom nomini kiriting." };

  const client = await asReader();
  const { error } = await client.POST("/raqamlar/{raqam}/menyu/taomlar", {
    params: { path: { raqam: handle } },
    body,
  });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

export async function editItem(handle: string, id: string, form: FormData): Promise<EditResult> {
  const body = itemBody(form);
  if (!body.nom.uz) return { ok: false, error: "Taom nomini kiriting." };

  const client = await asReader();
  const { error } = await client.PUT("/menyu/taomlar/{id}", {
    params: { path: { id } },
    body,
  });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

/** The daily one: the kitchen has run out, and it goes off the menu in a tap. */
export async function setItemAvailable(
  handle: string,
  id: string,
  available: boolean,
): Promise<EditResult> {
  const client = await asReader();
  const { error } = await client.PUT("/menyu/taomlar/{id}/bor", {
    params: { path: { id } },
    body: { bor: available },
  });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

/** The same, for one dish, and only within its own section. */
export async function moveItem(
  handle: string,
  id: string,
  direction: "up" | "down",
): Promise<EditResult> {
  const menu = await getMenu(handle);
  const items = menu.flatMap((c) => c.items);
  const at = items.findIndex((i) => i.id === id);
  const to = direction === "up" ? at - 1 : at + 1;
  if (at < 0 || to < 0 || to >= items.length) return { ok: true };

  const client = await asReader();
  const move = (target: string, tartib: number) =>
    client.PUT("/menyu/taomlar/{id}/tartib", {
      params: { path: { id: target } },
      body: { tartib },
    });

  const [a, b] = await Promise.all([
    move(items[at].id, items[to].position),
    move(items[to].id, items[at].position),
  ]);
  if (a.error || b.error) return FAILED;

  refresh(handle);
  return { ok: true };
}

export async function removeItem(handle: string, id: string): Promise<EditResult> {
  const client = await asReader();
  const { error } = await client.DELETE("/menyu/taomlar/{id}", { params: { path: { id } } });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

/**
 * A photograph for one dish.
 *
 * The upload happens here rather than in Go because the image store is
 * reached from this side; the backend is told the address afterwards. An
 * upload that does not happen is a message, not a failure — the dish keeps
 * whatever picture it had.
 */
export async function setItemPhoto(
  handle: string,
  id: string,
  form: FormData,
): Promise<EditResult> {
  if (!isStorageConfigured) return { ok: false, error: "Rasm yuklash sozlanmagan." };

  const file = form.get("photo");
  if (!(file instanceof File) || !file.size) {
    return { ok: false, error: "Rasm tanlanmadi." };
  }

  const url = await uploadImage(
    `menyu/${handle}/${id}`,
    Buffer.from(await file.arrayBuffer()),
    file.type || "image/jpeg",
  );
  if (!url) return { ok: false, error: "Rasm yuklanmadi." };

  const client = await asReader();
  const { error } = await client.PUT("/menyu/taomlar/{id}/rasm", {
    params: { path: { id } },
    body: { rasm: url },
  });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

// Obyektning o'zi -------------------------------------------------------------

export async function createVenue(handle: string, form: FormData): Promise<EditResult> {
  const nom = text(form.get("name"), 80);
  if (!nom) return { ok: false, error: "Obyekt nomini kiriting." };

  const client = await asReader();
  const { error } = await client.POST("/raqamlar/{raqam}/obyekt", {
    params: { path: { raqam: handle } },
    body: { nom, turi: (text(form.get("kind"), 10) || "cafe") as "cafe" },
  });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

export async function saveVenue(handle: string, form: FormData): Promise<EditResult> {
  const client = await asReader();
  const { error } = await client.PUT("/raqamlar/{raqam}/obyekt", {
    params: { path: { raqam: handle } },
    body: {
      nom: text(form.get("name"), 80),
      turi: (text(form.get("kind"), 10) || "cafe") as "cafe",
      ish_vaqti: text(form.get("hours"), 120),
      manzil: text(form.get("address"), 200),
      wifi: text(form.get("wifi_name"), 60),
      wifi_paroli: text(form.get("wifi_password"), 60),
    },
  });
  if (error) return FAILED;

  refresh(handle);
  return { ok: true };
}

export async function savePoints(handle: string, form: FormData): Promise<EditResult> {
  // One per line, as they are typed. Blank lines are how somebody separates
  // groups while typing, not points with no name.
  const points = String(form.get("points") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 200);

  const client = await asReader();
  const { error } = await client.PUT("/raqamlar/{raqam}/obyekt/nuqtalar", {
    params: { path: { raqam: handle } },
    body: { nuqtalar: points },
  });
  if (error) return FAILED;

  revalidatePath(`/kabinet/${handle}/nuqtalar`);
  return { ok: true };
}

/** A new counter link. The old one stops working the moment this returns. */
export async function rotateStaffToken(handle: string): Promise<EditResult> {
  const client = await asReader();
  const { error } = await client.POST("/raqamlar/{raqam}/obyekt/kalit", {
    params: { path: { raqam: handle } },
  });
  if (error) return FAILED;

  revalidatePath(`/kabinet/${handle}/nuqtalar`);
  return { ok: true };
}
