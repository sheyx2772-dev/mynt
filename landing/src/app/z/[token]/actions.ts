"use server";

import { revalidatePath } from "next/cache";

import { getVenueByStaffToken } from "@/lib/menu";
import { markRequestDone } from "@/lib/venue-requests";

// Closing a request from the counter phone.
//
// The token is the whole authorisation, and it is checked here rather than
// trusted from the page that rendered the button: a form can be posted by
// anyone. A token that matches no venue updates nothing, which is the same
// outcome as a token that was rotated a minute ago.
export async function markDoneFromCounter(form: FormData) {
  const token = String(form.get("token") ?? "");

  const venue = await getVenueByStaffToken(token);
  if (!venue) return;

  await markRequestDone(venue.id, String(form.get("id") ?? ""));
  revalidatePath(`/z/${token}`);
}
