"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getOwnedVenue } from "@/lib/menu";
import { savePoints, type EditResult } from "@/lib/menu-edit";

export async function savePointsAction(
  _prev: EditResult,
  form: FormData,
): Promise<EditResult> {
  const user = await requireUser();
  const handle = String(form.get("handle") ?? "").toUpperCase();

  const venue = await getOwnedVenue(handle, user.id);
  if (!venue) return { ok: false, error: "Bu obyekt sizniki emas." };

  const result = await savePoints(venue.id, form);
  if (result.ok) {
    revalidatePath(`/kabinet/${handle}/nuqtalar`);
    revalidatePath(`/kabinet/${handle}/nuqtalar/chop`);
  }
  return result;
}
