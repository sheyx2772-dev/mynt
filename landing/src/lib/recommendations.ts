import "server-only";

import { asReader, backend } from "@/lib/backend/client";

export type Recommender = { handle: string; name: string };

export async function isRecommended(handle: string): Promise<boolean> {
  const client = await asReader();
  const { data, error } = await client.GET("/profil/{raqam}", {
    params: { path: { raqam: handle } },
  });
  return !error && Boolean(data?.profil.tavsiya_qilganman);
}

/**
 * Who vouched, by their own number.
 *
 * Only people with a claimed number of their own: a recommendation from
 * somebody checkable is worth more than a name, and one from an account with
 * no profile is worth nothing at all.
 */
export async function listRecommenders(handle: string): Promise<Recommender[]> {
  const { data, error } = await backend.GET("/profil/{raqam}/tavsiyachilar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.tavsiyachilar ?? []).map((r) => ({ handle: r.raqam, name: r.ism }));
}

export type ToggleResult = { ok: true; on: boolean; count: number } | { ok: false };

export async function toggleRecommendation(handle: string, on: boolean): Promise<ToggleResult> {
  const client = await asReader();
  const { data, error } = await client.PUT("/profil/{raqam}/tavsiya", {
    params: { path: { raqam: handle } },
    body: { tavsiya: on },
  });
  if (error || !data) return { ok: false };

  return { ok: true, on: data.tavsiya, count: data.soni };
}
