"use server";

import { revalidatePath } from "next/cache";

import { requireOwnHandle } from "@/lib/kabinet";
import { createTag, setTagActive } from "@/lib/object-tags";

const PATH = "/kabinet/[handle]/buyumlar";

export type TagState = { error?: string; token?: string };

/** Register a thing, and get back the address to print on its tag. */
export async function addTag(
  _previous: TagState,
  form: FormData,
): Promise<TagState> {
  const { normalized, userId } = await requireOwnHandle(
    String(form.get("handle") ?? ""),
    PATH,
  );

  const result = await createTag(
    normalized,
    userId,
    String(form.get("kind") ?? ""),
    String(form.get("label") ?? ""),
  );

  if (!result.ok) return { error: "Qo'shilmadi. Yana urinib ko'ring." };

  revalidatePath(`/kabinet/${normalized}/buyumlar`);
  return { token: result.token };
}

/**
 * Stop or restart a tag.
 *
 * Retiring rather than deleting, because the sticker is still on the car: the
 * address has to keep existing and keep saying nothing.
 */
export async function toggleTag(form: FormData): Promise<void> {
  const { normalized, userId } = await requireOwnHandle(
    String(form.get("handle") ?? ""),
    PATH,
  );

  await setTagActive(
    normalized,
    userId,
    String(form.get("tagId") ?? ""),
    String(form.get("active") ?? "") === "1",
  );
  revalidatePath(`/kabinet/${normalized}/buyumlar`);
}
