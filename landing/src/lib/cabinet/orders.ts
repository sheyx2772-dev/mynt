import "server-only";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";

// The objects on order — cards, rings, tags — and where each one has got to.
//
// Account-level rather than per number: a person orders a card for one number
// and a ring for another in one sitting, and wants one list. The backend
// filters by account, so the list is this person's and nobody else's.

export type DeviceOrder = components["schemas"]["Device"];

export async function myOrders(): Promise<DeviceOrder[]> {
  const { api } = await asReader();
  const { data, error } = await api.GET("/qurilmalar", {});
  if (error || !data) return [];
  return data.buyurtmalar ?? [];
}
