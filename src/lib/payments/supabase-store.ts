import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PaymentStore, Order, PaymeTransaction, ClickTransaction } from "./store";

// PaymentStore backed by Supabase. Every write runs under the service_role
// key: providers call these endpoints unauthenticated, having proved
// themselves with a signature instead of a session.

function requireClient() {
  if (!supabaseAdmin) throw new Error("Supabase admin client is not configured.");
  return supabaseAdmin;
}

export class SupabasePaymentStore implements PaymentStore {
  async findOrder(orderId: string): Promise<Order | null> {
    // Order ids are UUIDs; a provider sending anything else would otherwise
    // make Postgres raise instead of simply not matching.
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;

    const { data } = await requireClient()
      .from("orders")
      .select("id, user_id, handle, amount, status")
      .eq("id", orderId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      handle: data.handle,
      amount: Number(data.amount),
      status: data.status,
    };
  }

  async markOrderPaid(orderId: string, provider: "click" | "payme", providerTxId: string) {
    const client = requireClient();

    // Conditional on `pending`, so a provider retry updates nothing and the
    // handle is never claimed twice.
    const { data: updated } = await client
      .from("orders")
      .update({
        status: "paid",
        provider,
        provider_tx_id: providerTxId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("handle, user_id")
      .maybeSingle();

    if (!updated) return; // already settled

    await client
      .from("handles")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
        reserved_until: null,
      })
      .eq("normalized", updated.handle)
      .eq("user_id", updated.user_id)
      .eq("status", "reserved");
  }

  async markOrderCancelled(orderId: string) {
    const client = requireClient();

    const { data: updated } = await client
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", orderId)
      .in("status", ["pending", "paid"])
      .select("handle, user_id")
      .maybeSingle();

    if (!updated) return;

    // Release the handle so it returns to the pool. This also covers a refund
    // after payment: the buyer got their money back, so they do not keep it.
    await client
      .from("handles")
      .delete()
      .eq("normalized", updated.handle)
      .eq("user_id", updated.user_id)
      .in("status", ["reserved", "claimed"]);
  }

  async findPaymeTransaction(id: string): Promise<PaymeTransaction | null> {
    const { data } = await requireClient()
      .from("payme_transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    return data ? rowToPayme(data) : null;
  }

  async findPaymeTransactionByOrder(orderId: string): Promise<PaymeTransaction | null> {
    const { data } = await requireClient()
      .from("payme_transactions")
      .select("*")
      .eq("order_id", orderId)
      .in("state", [1, 2])
      .maybeSingle();

    return data ? rowToPayme(data) : null;
  }

  async createPaymeTransaction(tx: PaymeTransaction) {
    await requireClient().from("payme_transactions").insert({
      id: tx.id,
      order_id: tx.orderId,
      amount: tx.amount,
      state: tx.state,
      create_time: tx.createTime,
      perform_time: tx.performTime,
      cancel_time: tx.cancelTime,
      reason: tx.reason,
    });
  }

  async updatePaymeTransaction(id: string, patch: Partial<PaymeTransaction>) {
    const row: Record<string, unknown> = {};
    if (patch.state !== undefined) row.state = patch.state;
    if (patch.performTime !== undefined) row.perform_time = patch.performTime;
    if (patch.cancelTime !== undefined) row.cancel_time = patch.cancelTime;
    if (patch.reason !== undefined) row.reason = patch.reason;

    await requireClient().from("payme_transactions").update(row).eq("id", id);
  }

  async findClickTransaction(id: string): Promise<ClickTransaction | null> {
    const { data } = await requireClient()
      .from("click_transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      orderId: data.order_id,
      amount: Number(data.amount),
      preparedAt: data.prepared_at,
      completedAt: data.completed_at,
      cancelledAt: data.cancelled_at,
    };
  }

  async createClickTransaction(tx: ClickTransaction) {
    await requireClient().from("click_transactions").insert({
      id: tx.id,
      order_id: tx.orderId,
      amount: tx.amount,
      prepared_at: tx.preparedAt,
      completed_at: tx.completedAt,
      cancelled_at: tx.cancelledAt,
    });
  }

  async updateClickTransaction(id: string, patch: Partial<ClickTransaction>) {
    const row: Record<string, unknown> = {};
    if (patch.preparedAt !== undefined) row.prepared_at = patch.preparedAt;
    if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;
    if (patch.cancelledAt !== undefined) row.cancelled_at = patch.cancelledAt;

    await requireClient().from("click_transactions").update(row).eq("id", id);
  }
}

function rowToPayme(data: Record<string, unknown>): PaymeTransaction {
  return {
    id: data.id as string,
    orderId: data.order_id as string,
    amount: Number(data.amount),
    state: data.state as PaymeTransaction["state"],
    createTime: Number(data.create_time),
    performTime: Number(data.perform_time),
    cancelTime: Number(data.cancel_time),
    reason: data.reason === null || data.reason === undefined ? null : Number(data.reason),
  };
}
