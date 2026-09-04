"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createVenue, type EditResult } from "@/lib/menu-edit";
import { parseHandle } from "@/lib/pricing";

export async function createVenueAction(
  _prev: EditResult,
  form: FormData,
): Promise<EditResult> {
  const user = await requireUser();

  const parsed = parseHandle(String(form.get("handle") ?? ""));
  if (!parsed) return { ok: false, error: "Raqam noto'g'ri." };
  const normalized = `${parsed.letters}${parsed.digits}`;

  const result = await createVenue(normalized, user.id, form);
  if (!result.ok) return result;

  revalidatePath(`/kabinet/${normalized}`);
  revalidatePath("/kabinet");
  revalidatePath(`/${normalized}`);

  // Straight into the empty list, because an object with nothing in it is not
  // yet worth putting on a table.
  redirect(`/kabinet/${normalized}/menyu`);
}
