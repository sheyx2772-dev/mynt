import "server-only";

import { asReader } from "@/lib/backend/client";

// Kim ko'rdi: the signed-in people who opened a profile, for its owner.
//
// The count comes for every owner; the names are premium and only for an
// owner who is not invisible — the backend decides, and says why the list
// is empty when it is, so the panel can say the right thing.

export type Viewer = {
  handle: string | null;
  name: string;
  avatarUrl: string | null;
  at: string;
  times: number;
};

export type Viewers = {
  viewers: Viewer[];
  /** Distinct accounts in the last 30 days. */
  count: number;
  reason: "ochiq" | "bepul" | "korinmas";
};

export async function listViewers(handle: string): Promise<Viewers> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/korganlar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return { viewers: [], count: 0, reason: "ochiq" };
  return {
    count: data.soni,
    reason: data.sabab,
    viewers: (data.korganlar ?? []).map((v) => ({
      handle: v.raqam ?? null,
      name: v.ism,
      avatarUrl: v.rasm ?? null,
      at: v.vaqt,
      times: v.marta,
    })),
  };
}

export async function getInvisible(): Promise<boolean> {
  const client = await asReader();
  const { data } = await client.GET("/men/korinmas");
  return data?.korinmas ?? false;
}

export async function setInvisible(on: boolean): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.PUT("/men/korinmas", { body: { korinmas: on } });
  return !error;
}
