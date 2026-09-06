import "server-only";

import { revalidatePath } from "next/cache";

import { asReader } from "@/lib/backend/client";
import { getOwnedHandle } from "@/lib/handles";
import { readProfileForm } from "@/lib/profile-form";

// Saving a profile.
//
// Two halves, and they are in different places on purpose. The pictures are
// uploaded from here, because the image store is reached from this side. The
// row is written by the backend, whose statement carries the owner's id — so
// there is no version of this that writes to a number somebody else holds.
//
// The plan is read from the row rather than the form. A client that sends
// `plan=premium` is describing itself, not granting itself anything.

export type SaveProfileResult =
  | { ok: true; imageFailed?: true }
  | { ok: false; error: string };

export async function saveProfile(
  normalized: string,
  formData: FormData,
): Promise<SaveProfileResult> {
  const current = await getOwnedHandle(normalized);
  if (!current) return { ok: false, error: "Bu handle sizga tegishli emas." };

  const read = await readProfileForm(
    formData,
    normalized,
    current.avatarUrl,
    current.bannerUrl,
    current.plan,
  );
  if (!read.ok) return { ok: false, error: read.error };

  const p = read.profile;
  const client = await asReader();
  const { error } = await client.PUT("/raqamlar/{raqam}/profil", {
    params: { path: { raqam: normalized } },
    body: {
      name: p.name,
      bio: p.bio ?? undefined,
      // The nine raw fields, not the rendered rows. This was `p.links as
      // never` — an array where the backend wants an object — and the cast
      // hid it, so every save came back 422 and no profile could be edited.
      links: p.linkFields,
      // A service with no price is stored as an empty one; the schema has no
      // null here, and `as never` was hiding that too.
      services: p.services.map((s) => ({ name: s.name, price: s.price ?? "" })),
      city: p.city ?? undefined,
      contactEmail: p.contactEmail ?? undefined,
      phone: p.phone ?? undefined,
      position: p.position ?? undefined,
      company: p.company ?? undefined,
      tags: (p.tags ?? []).join(","),
      cardDesign: String(formData.get("cardDesign") ?? ""),
      deviceType: String(formData.get("deviceType") ?? ""),
      avatarUrl: p.avatarUrl ?? undefined,
      bannerUrl: p.bannerUrl ?? undefined,
      commentsOpen: p.commentsOpen,
    },
  });

  if (error) return { ok: false, error: "Saqlanmadi. Qaytadan urinib ko'ring." };

  revalidatePath(`/${normalized}`);
  revalidatePath(`/kabinet/${normalized}/tahrirlash`);
  revalidatePath(`/kabinet/${normalized}`);
  revalidatePath("/kabinet");

  return { ok: true, ...(read.imageFailed ? { imageFailed: true as const } : {}) };
}
