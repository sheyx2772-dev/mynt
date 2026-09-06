import "server-only";

import { asReader } from "@/lib/backend/client";

export type ProfileComment = {
  id: number;
  authorHandle: string | null;
  authorName: string;
  body: string;
  createdAt: string;
  /** Whether the reader wrote it, and so may remove it. */
  mine: boolean;
};

/**
 * What has been said on a profile.
 *
 * A profile with comments closed returns nothing — not rows the page then
 * hides. The condition is in the query, joined through `handles`, so there is
 * no state in which the rows exist here and the check is somewhere else.
 */
export async function listComments(handle: string): Promise<ProfileComment[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/profil/{raqam}/izohlar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.izohlar ?? []).map((c) => ({
    id: c.id,
    authorHandle: c.muallif_raqami ?? null,
    authorName: c.muallif,
    body: c.matn,
    createdAt: c.vaqt,
    mine: c.meniki,
  }));
}

export type CommentResult = { ok: boolean; error?: string };

export async function addComment(handle: string, body: string): Promise<CommentResult> {
  const client = await asReader();
  const { error, response } = await client.POST("/profil/{raqam}/izohlar", {
    params: { path: { raqam: handle } },
    body: { matn: body },
  });
  if (!error) return { ok: true };

  if (response.status === 401) return { ok: false, error: "Avval hisobingizga kiring." };
  // A closed profile and a missing one answer alike, on purpose: whether
  // somebody has switched comments off is not a fact to advertise.
  return { ok: false, error: "Bu profilga izoh qoldirib bo'lmaydi." };
}

/** Either the author or the profile's owner may remove one. */
export async function deleteComment(handle: string, id: number): Promise<CommentResult> {
  const client = await asReader();
  const { error } = await client.DELETE("/profil/{raqam}/izohlar/{id}", {
    params: { path: { raqam: handle, id } },
  });
  return error ? { ok: false, error: "O'chirilmadi. Qaytadan urinib ko'ring." } : { ok: true };
}
