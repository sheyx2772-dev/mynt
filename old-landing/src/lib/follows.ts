import "server-only";

import { asReader } from "@/lib/backend/client";

export async function isFollowing(handle: string): Promise<boolean> {
  return (await followState(handle)) === "obuna";
}

/** Where the reader stands with a number, read off the profile itself. */
export async function followState(handle: string): Promise<FollowState> {
  const client = await asReader();
  const { data, error } = await client.GET("/profil/{raqam}", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return "yoq";
  if (data.profil.obunaman) return "obuna";
  if (data.profil.sorov_kutilmoqda) return "kutilmoqda";
  return "yoq";
}

export async function countFollowing(): Promise<number> {
  const client = await asReader();
  const { data, error } = await client.GET("/men/obunalar", {});
  return error || !data ? 0 : data.soni;
}

export type FollowState = "obuna" | "kutilmoqda" | "yoq";

/**
 * Turns following on or off and answers with where the reader now stands.
 *
 * Three states rather than a boolean, because a closed profile takes a request
 * where an open one takes a follow, and the server decides which from the
 * stored row. A client that pressed "follow" on a closed profile is told
 * "kutilmoqda" and draws that — not "following", which would be a lie.
 */
export async function setFollowing(handle: string, on: boolean): Promise<FollowState> {
  const client = await asReader();
  const { data, error } = await client.PUT("/profil/{raqam}/obuna", {
    params: { path: { raqam: handle } },
    body: { obuna: on },
  });
  if (error || !data) return on ? "yoq" : "obuna";
  return data.holat;
}
