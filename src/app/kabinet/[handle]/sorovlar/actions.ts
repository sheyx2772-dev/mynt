"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getOwnedVenue } from "@/lib/menu";
import { markRequestDone } from "@/lib/venue-requests";
import { rotateStaffToken } from "@/lib/menu-edit";

export async function markDoneAction(form: FormData) {
  const user = await requireUser();
  const handle = String(form.get("handle") ?? "").toUpperCase();

  // Ownership is the query here too: a forged handle resolves to no venue, and
  // the update then matches no rows rather than closing somebody else's table.
  const venue = await getOwnedVenue(handle, user.id);
  if (!venue) return;

  await markRequestDone(venue.id, String(form.get("id") ?? ""));
  revalidatePath(`/kabinet/${handle}/sorovlar`);
}

export async function rotateStaffTokenAction(form: FormData) {
  const user = await requireUser();
  const handle = String(form.get("handle") ?? "").toUpperCase();

  const venue = await getOwnedVenue(handle, user.id);
  if (!venue) return;

  await rotateStaffToken(venue.id);
  revalidatePath(`/kabinet/${handle}/sorovlar`);
}
