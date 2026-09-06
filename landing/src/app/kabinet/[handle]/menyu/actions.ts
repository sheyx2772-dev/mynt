"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getOwnedVenue } from "@/lib/menu";
import {
  addCategory,
  editCategory,
  removeCategory,
  addItem,
  editItem,
  moveItem,
  moveCategory,
  setItemAvailable,
  setItemPhoto,
  removeItem,
  saveVenue,
  type EditResult,
} from "@/lib/menu-edit";

// Every action resolves the venue from the signed-in user's own handle before
// it touches anything. The handle comes from the form, so it is not trusted:
// getOwnedVenue filters on user_id, and a handle somebody else owns comes back
// null rather than editable.

/** The same ownership check, for the two actions called with plain arguments. */
async function venueForHandle(raw: string) {
  await requireUser();
  return getOwnedVenue(raw.toUpperCase());
}

async function venueFor(form: FormData) {
  const user = await requireUser();
  const handle = String(form.get("handle") ?? "").toUpperCase();
  return { venue: await getOwnedVenue(handle), handle };
}

const DENIED: EditResult = { ok: false, error: "Bu obyekt sizniki emas." };

export async function addCategoryAction(_prev: EditResult, form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return DENIED;

  const result = await addCategory(handle, form);
  if (result.ok) revalidatePath(`/kabinet/${handle}/menyu`);
  return result;
}

export async function removeCategoryAction(
  handle: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const venue = await venueForHandle(handle);
  if (!venue) return { ok: false, error: "Bu raqam sizniki emas." };

  const result = await removeCategory(handle, id);
  if (result && result.ok === false) {
    return { ok: false, error: result.error ?? "O'chirilmadi." };
  }
  revalidatePath(`/kabinet/${handle}/menyu`);
  return { ok: true };
}

export async function addItemAction(_prev: EditResult, form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return DENIED;

  const result = await addItem(handle, form);
  if (result.ok) revalidatePath(`/kabinet/${handle}/menyu`);
  return result;
}

export async function toggleItemAction(form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return;

  await setItemAvailable(
    venue.id,
    String(form.get("id") ?? ""),
    form.get("available") === "1",
  );
  revalidatePath(`/kabinet/${handle}/menyu`);
  revalidatePath(`/${handle}`);
}

export async function removeItemAction(
  handle: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const venue = await venueForHandle(handle);
  if (!venue) return { ok: false, error: "Bu raqam sizniki emas." };

  const result = await removeItem(handle, id);
  if (result && result.ok === false) {
    return { ok: false, error: result.error ?? "O'chirilmadi." };
  }
  revalidatePath(`/kabinet/${handle}/menyu`);
  return { ok: true };
}

export async function saveVenueAction(_prev: EditResult, form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return DENIED;

  const result = await saveVenue(venue.id, form);
  if (result.ok) {
    revalidatePath(`/kabinet/${handle}/menyu`);
    revalidatePath(`/${handle}`);
  }
  return result;
}

// Returns its result rather than swallowing it. A photograph that quietly does
// not appear is an afternoon wasted trying again with a different file, when
// what happened was that storage refused the key.
export async function setItemPhotoAction(_prev: EditResult, form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return DENIED;

  const result = await setItemPhoto(handle, String(form.get("id") ?? ""), form);
  if (result.ok) {
    revalidatePath(`/kabinet/${handle}/menyu`);
    revalidatePath(`/${handle}`);
  }
  return result;
}

export async function editItemAction(_prev: EditResult, form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return DENIED;

  const result = await editItem(handle, String(form.get("id") ?? ""), form);
  if (!result.ok) return result;

  revalidatePath(`/kabinet/${handle}/menyu`);
  revalidatePath(`/${handle}`);

  // Back to the list rather than a message on the form: the row showing the new
  // price is the confirmation, and it is the thing they came to check.
  redirect(`/kabinet/${handle}/menyu`);
}

export async function moveItemAction(form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return;

  const direction = form.get("direction") === "up" ? "up" : "down";
  await moveItem(handle, String(form.get("id") ?? ""), direction);
  revalidatePath(`/kabinet/${handle}/menyu`);
  revalidatePath(`/${handle}`);
}

export async function moveCategoryAction(form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return;

  const direction = form.get("direction") === "up" ? "up" : "down";
  await moveCategory(handle, String(form.get("id") ?? ""), direction);
  revalidatePath(`/kabinet/${handle}/menyu`);
  revalidatePath(`/${handle}`);
}

export async function editCategoryAction(_prev: EditResult, form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return DENIED;

  const result = await editCategory(handle, String(form.get("id") ?? ""), form);
  if (!result.ok) return result;

  revalidatePath(`/kabinet/${handle}/menyu`);
  revalidatePath(`/${handle}`);
  redirect(`/kabinet/${handle}/menyu`);
}
