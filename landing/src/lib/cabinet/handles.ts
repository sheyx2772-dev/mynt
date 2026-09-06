import "server-only";

import { cache } from "react";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";

// The numbers this account holds, and one of them.
//
// Ownership is a filter on the backend's query, never a check here. Asking
// for a number somebody else holds comes back 404 from `/raqamlar/{raqam}` —
// the same 404 an invented number gets — and this turns both into null. A
// page that receives null calls `notFound()`, so a guesser walking numbers
// learns nothing from the difference between "not yours" and "not a number".

export type OwnedHandle = components["schemas"]["Handle"];

/** Three letters, three digits, upper case — or nothing reaches the backend. */
export function normalize(raw: string): string | null {
  const handle = raw.toUpperCase();
  return /^[A-Z]{3}[0-9]{3}$/.test(handle) ? handle : null;
}

/** Every number on the account, oldest claim first. Empty for a stranger. */
export const myHandles = cache(async (): Promise<OwnedHandle[]> => {
  const { api } = await asReader();
  const { data, error } = await api.GET("/raqamlar", {});
  if (error || !data) return [];
  // Oldest first, because that is the number somebody's cards are printed with;
  // the newest is usually one they just bought and have not used yet.
  return [...(data.raqamlar ?? [])].sort((a, b) =>
    (a.olingan ?? "").localeCompare(b.olingan ?? ""),
  );
});

/** One number, if it is this account's. Null otherwise — for any reason. */
export const ownedHandle = cache(
  async (raw: string): Promise<OwnedHandle | null> => {
    const raqam = normalize(raw);
    if (!raqam) return null;

    const { api } = await asReader();
    const { data, error } = await api.GET("/raqamlar/{raqam}", {
      params: { path: { raqam } },
    });
    if (error || !data?.raqam) return null;
    return data.raqam;
  },
);
