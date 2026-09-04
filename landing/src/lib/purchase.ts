import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

// One order, read back by the person who placed it.
//
// This is what a buyer lands on after a payment provider sends them back, so it
// has to answer for every kind of order and for every state one can be in —
// including the two that are somebody's bad afternoon: paid but the number was
// lost, and cancelled after the money moved.

export type Purchase = {
  id: string;
  handle: string;
  amount: number;
  kind: "handle" | "subscription" | "device";
  status: "pending" | "paid" | "cancelled" | "failed";
  /** Whether the number is still held for this buyer. */
  held: boolean;
};

export async function getPurchase(id: string, userId: string): Promise<Purchase | null> {
  if (!supabaseAdmin) return null;
  // Order ids are UUIDs; anything else would make Postgres raise rather than
  // simply not match.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  // The user filter is the authorization: somebody else's order is not found,
  // which is the same answer an invented id gets.
  const { data } = await supabaseAdmin
    .from("orders")
    .select("id, handle, amount, kind, status")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const { data: handle } = await supabaseAdmin
    .from("handles")
    .select("normalized")
    .eq("normalized", data.handle)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    id: data.id,
    handle: data.handle,
    amount: Number(data.amount),
    kind: data.kind,
    status: data.status,
    held: Boolean(handle),
  };
}
