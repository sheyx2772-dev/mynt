import "server-only";

import { asReader } from "@/lib/backend/client";

// One order, read back by the person who placed it.
//
// This is what a buyer lands on after a payment provider sends them back, so
// it has to answer for every kind of order and for every state one can be in
// — including the two that are somebody's bad afternoon: paid but the number
// was lost, and cancelled after the money moved.

export type Purchase = {
  id: string;
  handle: string;
  amount: number;
  kind: "handle" | "subscription" | "device";
  status: "pending" | "paid" | "cancelled" | "failed";
  /** Whether the number is still held for this buyer. */
  held: boolean;
};

export async function getPurchase(id: string): Promise<Purchase | null> {
  const client = await asReader();

  // Somebody else's order is not found, which is the same answer an invented
  // id gets — and the filter is now on a server the browser cannot reach,
  // rather than on a query the browser's key could have run.
  const { data, error } = await client.GET("/buyurtmalar/{id}", {
    params: { path: { id } },
  });
  if (error || !data?.buyurtma) return null;

  const o = data.buyurtma;
  return {
    id: o.id,
    handle: o.raqam,
    amount: o.summa,
    kind: o.turi as Purchase["kind"],
    status: o.holat,
    // Not implied by `paid`: a refund releases the number, and money that
    // arrived after the hold lapsed leaves a paid order with nothing attached.
    held: o.meniki,
  };
}
