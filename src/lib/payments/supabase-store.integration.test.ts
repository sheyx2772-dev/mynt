import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadEnvLocal } from "@/test/env";

// Exercises SupabasePaymentStore against the real project: the handler logic
// is covered by the in-memory fake, but the SQL behind it is not, and a
// mistyped column or a filter that silently matches nothing would not show up
// anywhere else.
//
// Skipped unless RUN_DB_TESTS=1, because it writes to the live database.
// Everything it creates is removed again in afterAll.
//
//   RUN_DB_TESTS=1 npm test -- supabase-store

loadEnvLocal();

const enabled = process.env.RUN_DB_TESTS === "1" && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!enabled)("SupabasePaymentStore against the live project", () => {
  const HANDLE = "ZZQ909"; // reserved for this test
  const PRICE = 12_345;

  let store: import("./supabase-store").SupabasePaymentStore;
  let admin: NonNullable<typeof import("@/lib/supabase/admin")["supabaseAdmin"]>;
  let userId: string;
  let orderId: string;
  let subOrderId: string;

  beforeAll(async () => {
    ({ supabaseAdmin: admin } = (await import("@/lib/supabase/admin")) as never);
    const { SupabasePaymentStore } = await import("./supabase-store");
    store = new SupabasePaymentStore();

    const created = await admin.auth.admin.createUser({
      email: `store-test-${Date.now()}@flex.com.uz`,
      email_confirm: true,
    });
    userId = created.data.user!.id;

    await admin.from("handles").delete().eq("normalized", HANDLE);
    await admin.from("handles").insert({
      letters: HANDLE.slice(0, 3),
      digits: HANDLE.slice(3),
      status: "reserved",
      user_id: userId,
      owner_name: "Store Test",
      reserved_until: new Date(Date.now() + 600_000).toISOString(),
    });

    const order = await admin
      .from("orders")
      .insert({ user_id: userId, handle: HANDLE, amount: PRICE })
      .select("id")
      .single();
    orderId = order.data!.id;
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("handles").delete().eq("normalized", HANDLE);
    if (orderId) await admin.from("orders").delete().eq("id", orderId);
    if (subOrderId) await admin.from("orders").delete().eq("id", subOrderId);
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("reads the order back with the right shape", async () => {
    const order = await store.findOrder(orderId);
    expect(order).toMatchObject({ id: orderId, handle: HANDLE, amount: PRICE, status: "pending" });
  });

  // A provider could send anything as merchant_trans_id; a non-UUID must not
  // reach Postgres as a uuid comparison.
  it("returns null for a malformed order id instead of throwing", async () => {
    await expect(store.findOrder("not-a-uuid")).resolves.toBeNull();
    await expect(store.findOrder("")).resolves.toBeNull();
  });

  it("stores and reads a Payme transaction", async () => {
    await store.createPaymeTransaction({
      id: "store-test-tx",
      orderId,
      amount: PRICE * 100,
      state: 1,
      createTime: 1_800_000_000_000,
      performTime: 0,
      cancelTime: 0,
      reason: null,
    });

    const tx = await store.findPaymeTransaction("store-test-tx");
    expect(tx).toMatchObject({ orderId, state: 1, createTime: 1_800_000_000_000 });

    const byOrder = await store.findPaymeTransactionByOrder(orderId);
    expect(byOrder?.id).toBe("store-test-tx");
  });

  it("applies a partial update without clearing other columns", async () => {
    await store.updatePaymeTransaction("store-test-tx", { state: 2, performTime: 1_800_000_001_000 });

    const tx = await store.findPaymeTransaction("store-test-tx");
    expect(tx).toMatchObject({
      state: 2,
      performTime: 1_800_000_001_000,
      createTime: 1_800_000_000_000,
      cancelTime: 0,
    });
  });

  it("settles the order and turns the reservation into a claim", async () => {
    await store.markOrderPaid(orderId, "payme", "store-test-tx");

    const order = await store.findOrder(orderId);
    expect(order?.status).toBe("paid");

    const { data: handle } = await admin
      .from("handles")
      .select("status, claimed_at, reserved_until")
      .eq("normalized", HANDLE)
      .single();

    expect(handle!.status).toBe("claimed");
    expect(handle!.claimed_at).not.toBeNull();
    expect(handle!.reserved_until).toBeNull();
  });

  // A subscription settles through the same conditional update, but must land
  // on the plan instead of the handle's status.
  it("settles a subscription by extending the plan", async () => {
    const created = await admin
      .from("orders")
      .insert({
        user_id: userId,
        handle: HANDLE,
        amount: 49_000,
        kind: "subscription",
        months: 1,
      })
      .select("id")
      .single();
    subOrderId = created.data!.id;

    await store.markOrderPaid(subOrderId, "payme", "store-test-sub");

    const { data: after } = await admin
      .from("handles")
      .select("status, plan, plan_expires_at")
      .eq("normalized", HANDLE)
      .single();

    expect(after!.plan).toBe("premium");
    expect(new Date(after!.plan_expires_at as string).getTime()).toBeGreaterThan(
      Date.now() + 27 * 24 * 3600 * 1000,
    );
    // The handle it was bought for is untouched.
    expect(after!.status).toBe("claimed");
  });

  // The fault this guards is the expensive one: a cancelled 49,000 so'm renewal
  // must never delete a number the owner paid for separately.
  it("cancelling a subscription refunds the months and keeps the handle", async () => {
    await store.markOrderCancelled(subOrderId);

    const { data: after } = await admin
      .from("handles")
      .select("status, plan_expires_at")
      .eq("normalized", HANDLE)
      .single();

    expect(after).not.toBeNull();
    expect(after!.status).toBe("claimed");
    expect(new Date(after!.plan_expires_at as string).getTime()).toBeLessThan(Date.now() + 1000);
  });

  // Providers retry. A second settlement must change nothing.
  it("is idempotent when the provider repeats the callback", async () => {
    const { data: before } = await admin
      .from("orders")
      .select("paid_at, provider_tx_id")
      .eq("id", orderId)
      .single();

    await store.markOrderPaid(orderId, "click", "a-different-id");

    const { data: after } = await admin
      .from("orders")
      .select("paid_at, provider_tx_id")
      .eq("id", orderId)
      .single();

    expect(after).toEqual(before);
  });

  it("releases the handle when the order is cancelled", async () => {
    await store.markOrderCancelled(orderId);

    const order = await store.findOrder(orderId);
    expect(order?.status).toBe("cancelled");

    const { data: handle } = await admin
      .from("handles")
      .select("normalized")
      .eq("normalized", HANDLE)
      .maybeSingle();

    expect(handle).toBeNull();
  });
});
