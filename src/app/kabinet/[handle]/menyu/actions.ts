"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getOwnedVenue } from "@/lib/menu";
import {
  addCategory,
  removeCategory,
  addItem,
  setItemAvailable,
  removeItem,
  saveVenue,
  type EditResult,
} from "@/lib/menu-edit";

// Every action resolves the venue from the signed-in user's own handle before
// it touches anything. The handle comes from the form, so it is not trusted:
// getOwnedVenue filters on user_id, and a handle somebody else owns comes back
// null rather than editable.

async function venueFor(form: FormData) {
  const user = await requireUser();
  const handle = String(form.get("handle") ?? "").toUpperCase();
  return { venue: await getOwnedVenue(handle, user.id), handle };
}

const DENIED: EditResult = { ok: false, error: "Bu obyekt sizniki emas." };

export async function addCategoryAction(_prev: EditResult, form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return DENIED;

  const result = await addCategory(venue.id, form);
  if (result.ok) revalidatePath(`/kabinet/${handle}/menyu`);
  return result;
}

export async function removeCategoryAction(form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return;

  await removeCategory(venue.id, String(form.get("id") ?? ""));
  revalidatePath(`/kabinet/${handle}/menyu`);
}

export async function addItemAction(_prev: EditResult, form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return DENIED;

  const result = await addItem(venue.id, form);
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

export async function removeItemAction(form: FormData) {
  const { venue, handle } = await venueFor(form);
  if (!venue) return;

  await removeItem(venue.id, String(form.get("id") ?? ""));
  revalidatePath(`/kabinet/${handle}/menyu`);
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
