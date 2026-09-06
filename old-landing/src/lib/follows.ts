import "server-only";

import { asReader } from "@/lib/backend/client";

export async function isFollowing(handle: string): Promise<boolean> {
  const client = await asReader();
  const { data, error } = await client.GET("/profil/{raqam}", {
    params: { path: { raqam: handle } },
  });
  return !error && Boolean(data?.profil.obunaman);
}

export async function countFollowing(): Promise<number> {
  const client = await asReader();
  const { data, error } = await client.GET("/men/obunalar", {});
  return error || !data ? 0 : data.soni;
}

/** Turns following on or off and answers with the state it reached. */
export async function setFollowing(handle: string, on: boolean): Promise<boolean> {
  const client = await asReader();
  const { data, error } = await client.PUT("/profil/{raqam}/obuna", {
    params: { path: { raqam: handle } },
    body: { obuna: on },
  });
  return error || !data ? !on : data.obuna;
}
