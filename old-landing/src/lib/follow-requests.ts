import "server-only";

import { asReader } from "@/lib/backend/client";

// Who is waiting at the door of a closed profile, and the owner's answer.
//
// Both go through the owner's session: the backend joins the number to the
// reader, so somebody else's number yields an empty inbox and a decision on it
// matches nothing. Nothing here checks ownership — it has nowhere to check it
// from that the query has not already used.

export type FollowRequest = {
  userId: string;
  /** The asker's own number, when they have one. A name is a claim; this is a page. */
  handle: string | null;
  name: string | null;
  avatarUrl: string | null;
  askedAt: string;
};

export async function listFollowRequests(handle: string): Promise<{ requests: FollowRequest[]; count: number }> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/obuna-sorovlari", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return { requests: [], count: 0 };
  return {
    count: data.soni,
    requests: (data.sorovlar ?? []).map((r) => ({
      userId: r.foydalanuvchi,
      handle: r.raqam ?? null,
      name: r.ism ?? null,
      avatarUrl: r.rasm ?? null,
      askedAt: r.sorlagan,
    })),
  };
}

/** The owner's answer. False means the request was not there to answer. */
export async function decideFollowRequest(handle: string, userId: string, accept: boolean): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.PUT("/raqamlar/{raqam}/obuna-sorovlari/{foydalanuvchi}", {
    params: { path: { raqam: handle, foydalanuvchi: userId } },
    body: { qabul: accept },
  });
  return !error;
}
