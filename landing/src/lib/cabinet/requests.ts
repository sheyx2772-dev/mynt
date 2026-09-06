import "server-only";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";
import { normalize } from "./handles";

// The owner's inbox: who is waiting at the door of a closed profile.
//
// Both calls are filtered by the backend on owner — somebody else's number
// comes back as an empty list and a 404 respectively. Nothing here compares
// ids; it could not, because it never sees any but the caller's own.

export type FollowRequest = components["schemas"]["FollowRequest"];

export async function pendingRequests(
  raw: string,
): Promise<{ list: FollowRequest[]; count: number }> {
  const raqam = normalize(raw);
  if (!raqam) return { list: [], count: 0 };

  const { api } = await asReader();
  const { data, error } = await api.GET("/raqamlar/{raqam}/obuna-sorovlari", {
    params: { path: { raqam } },
  });
  if (error || !data) return { list: [], count: 0 };
  return { list: data.sorovlar ?? [], count: data.soni };
}

/**
 * Let somebody in, or not. False when there was nothing to decide — not the
 * owner, already decided, never asked — which the backend folds into one 404.
 */
export async function decideRequest(
  raw: string,
  user: string,
  accept: boolean,
): Promise<boolean> {
  const raqam = normalize(raw);
  // A uuid, or nothing is sent: the id is a path segment on the backend.
  if (!raqam || !/^[0-9a-f-]{36}$/i.test(user)) return false;

  const { api } = await asReader();
  const { error } = await api.PUT(
    "/raqamlar/{raqam}/obuna-sorovlari/{foydalanuvchi}",
    {
      params: { path: { raqam, foydalanuvchi: user } },
      body: { qabul: accept },
    },
  );
  return !error;
}
