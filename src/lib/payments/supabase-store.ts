import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { announcePaidDeviceOrder } from "@/lib/device-orders";
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
      .select("handle, user_id, kind, months, device_type")
      .maybeSingle();

    if (!updated) return; // already settled

    // What the money bought. Both settle through this one conditional update,
    // so a provider retry is a no-op for a subscription exactly as it is for a
    // handle — the second call finds nothing pending and extends nothing.
    if (updated.kind === "subscription") {
      await client.rpc("extend_premium", {
        target_handle: updated.handle,
        add_months: updated.months ?? 1,
      });
      return;
    }

    // A device is a physical thing: nothing about the number changes, and the
    // work starts elsewhere. This is the only place that knows a sale actually
    // completed, so it is the only place that can raise the notice — an order
    // that was placed is not an order that was paid for.
    if (updated.kind === "device") {
      announcePaidDeviceOrder({
        id: orderId,
        handle: updated.handle,
        deviceType: String(updated.device_type ?? ""),
      });
      return;
    }

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

    // Read before writing, because the compensation depends on what the order
    // was for and whether it had already been paid. The update below is still
    // the thing that decides: it is conditional, so a repeated cancellation
    // changes nothing and compensates nothing.
    const { data: before } = await client
      .from("orders")
      .select("kind, months, status")
      .eq("id", orderId)
      .maybeSingle();

    const { data: updated } = await client
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", orderId)
      .in("status", ["pending", "paid"])
      .select("handle, user_id")
      .maybeSingle();

    if (!updated) return;

    // A cancelled subscription must never touch the handle. The number was
    // bought separately and is the owner's; deleting it because a 49,000 so'm
    // renewal was refunded would destroy a paid asset over a monthly fee.
    if (before?.kind === "subscription") {
      // Only a refund needs undoing. An order cancelled before payment never
      // extended anything, so subtracting would take time the owner paid for.
      if (before.status === "paid") {
        await client.rpc("extend_premium", {
          target_handle: updated.handle,
          add_months: -(before.months ?? 1),
        });
      }
      return;
    }

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
