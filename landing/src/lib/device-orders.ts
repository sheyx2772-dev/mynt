import "server-only";

import { after } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { operatorUserId } from "@/lib/operator";
import { canAdvance, isFulfilment, type Fulfilment } from "@/lib/fulfilment";
import { addressLine, type Delivery } from "@/lib/delivery";
import { devicePrice, isDeviceType, type DeviceTypeId } from "@/lib/devices";
import type { CardDesignId } from "@/lib/card-designs";

// Buying the object, and getting it to the person who bought it.
//
// The number and the device are priced separately — src/lib/plans.ts says why —
// and this is the half that has to be manufactured and posted. Everything about
// the order that a courier or a maker needs is written on the order itself
// rather than read off the profile later: an owner may change the form factor
// on their card afterwards, and what was paid for must not change with it.

export type DeviceOrder = {
  id: string;
  handle: string;
  deviceType: DeviceTypeId;
  design: CardDesignId | null;
  amount: number;
  status: "pending" | "paid" | "cancelled" | "failed";
  fulfilment: Fulfilment;
  recipient: string | null;
  phone: string | null;
  region: string | null;
  address: string | null;
  note: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  handle: string;
  device_type: string;
  design: string | null;
  amount: number;
  status: string;
  fulfilment: string;
  recipient: string | null;
  phone: string | null;
  region: string | null;
  address: string | null;
  delivery_note: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  created_at: string;
};

const COLUMNS =
  "id, handle, device_type, design, amount, status, fulfilment, recipient, " +
  "phone, region, address, delivery_note, paid_at, shipped_at, created_at";

function toOrder(raw: unknown): DeviceOrder {
  const row = raw as Row;

  return {
    id: row.id,
    handle: row.handle,
    deviceType: row.device_type as DeviceTypeId,
    design: (row.design as CardDesignId | null) ?? null,
    amount: row.amount,
    status: row.status as DeviceOrder["status"],
    fulfilment: row.fulfilment as Fulfilment,
    recipient: row.recipient,
    phone: row.phone,
    region: row.region,
    address: row.address,
    note: row.delivery_note,
    paidAt: row.paid_at,
    shippedAt: row.shipped_at,
    createdAt: row.created_at,
  };
}

export type PlaceResult =
  | { ok: true; orderId: string; amount: number }
  | { ok: false; error: "notOwned" | "unknownDevice" | "failed" };

/**
 * Order a device against a number the buyer already owns.
 *
 * The price is read from the server's own table, never from the form: a posted
 * amount is a discount anybody can grant themselves. Ownership is a filter on
 * the read rather than a check before it, so a guessed handle finds nothing
 * instead of being told it exists.
 */
export async function placeDeviceOrder(
  userId: string,
  handle: string,
  deviceType: string,
  design: string | null,
): Promise<PlaceResult> {
  if (!isDeviceType(deviceType)) return { ok: false, error: "unknownDevice" };
  if (!supabaseAdmin) return { ok: false, error: "failed" };

  const { data: owned } = await supabaseAdmin
    .from("handles")
    .select("normalized")
    .eq("normalized", handle)
    .eq("user_id", userId)
    .eq("status", "claimed")
    .maybeSingle();

  if (!owned) return { ok: false, error: "notOwned" };

  const amount = devicePrice(deviceType);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      handle,
      amount,
      kind: "device",
      device_type: deviceType,
      design,
      // Where every paid device order starts. It cannot start in the queue,
      // because at this point nobody has said where it goes.
      fulfilment: "address_needed",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "failed" };

  return { ok: true, orderId: data.id, amount };
}

/**
 * Tell whoever makes these that a device has been paid for.
 *
 * Called from the payment settlement rather than from the shop, because an
 * order that was placed is not an order that was bought. Runs in `after()`: a
 * provider is waiting on the response and a notification must not be what makes
 * it time out and retry.
 */
export function announcePaidDeviceOrder(order: {
  id: string;
  handle: string;
  deviceType: string;
}): void {
  const operator = operatorUserId();
  if (!operator) {
    // Loud rather than silent. A sale nobody is told about is the bug this
    // function exists to fix, and a deployment missing the setting would
    // otherwise reproduce it exactly.
    console.error("device order paid but FLEX_OPERATOR_USER_ID is unset", order.id);
    return;
  }

  after(async () => {
    await notify({
      userId: operator,
      kind: "device_order",
      handle: order.handle,
      title: `Qurilma sotildi — ${order.handle}`,
      body: `${order.deviceType} · manzil kutilmoqda`,
      href: "/kabinet/buyurtmalar",
    });
  });
}

export type AddressResult = { ok: true } | { ok: false; error: "notFound" | "failed" };

/**
 * Write the delivery address, and move the order into the queue.
 *
 * One write, not two. The address and the state change together because the
 * database will not accept the state without the address — and an order that
 * has an address but is still marked as needing one is an order that sits in
 * the wrong list forever.
 */
export async function setDeliveryAddress(
  userId: string,
  orderId: string,
  delivery: Delivery,
): Promise<AddressResult> {
  if (!supabaseAdmin) return { ok: false, error: "failed" };

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      recipient: delivery.recipient,
      phone: delivery.phone,
      region: delivery.region,
      address: delivery.address,
      delivery_note: delivery.note,
      fulfilment: "queued",
    })
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("kind", "device")
    .eq("status", "paid")
    // Only from the state that is waiting for it. A buyer who submits the form
    // twice, or who edits an address after the parcel has been posted, must not
    // pull it back into the queue.
    .eq("fulfilment", "address_needed")
    .select("id, handle, device_type, region, address")
    .maybeSingle();

  if (error) return { ok: false, error: "failed" };
  if (!data) return { ok: false, error: "notFound" };

  const operator = operatorUserId();
  if (operator) {
    after(async () => {
      await notify({
        userId: operator,
        kind: "device_order",
        handle: data.handle,
        title: `Manzil keldi — ${data.handle}`,
        body: `${data.device_type} · ${addressLine({
          region: data.region as string,
          address: data.address as string,
        })}`,
        href: "/kabinet/buyurtmalar",
      });
    });
  }

  return { ok: true };
}

/**
 * Move one order along.
 *
 * The allowed steps are in src/lib/fulfilment.ts and are checked here as well
 * as being drawn there: the screen greys out what cannot be done, and this
 * refuses it, because a button is not a permission.
 */
export async function advanceOrder(
  orderId: string,
  to: string,
): Promise<{ ok: boolean }> {
  if (!isFulfilment(to)) return { ok: false };
  if (!supabaseAdmin) return { ok: false };

  const { data: current } = await supabaseAdmin
    .from("orders")
    .select("fulfilment")
    .eq("id", orderId)
    .eq("kind", "device")
    .maybeSingle();

  if (!current || !isFulfilment(current.fulfilment)) return { ok: false };
  if (!canAdvance(current.fulfilment, to)) return { ok: false };

  const { data } = await supabaseAdmin
    .from("orders")
    .update({ fulfilment: to })
    .eq("id", orderId)
    .eq("kind", "device")
    // Conditional on what we read, so two people clicking at once move it one
    // step rather than two. shipped_at is stamped by a trigger, not here.
    .eq("fulfilment", current.fulfilment)
    .select("id")
    .maybeSingle();

  return { ok: Boolean(data) };
}

/** The queue whoever makes these works from: paid, unfinished, oldest first. */
export async function listQueue(): Promise<DeviceOrder[]> {
  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("orders")
    .select(COLUMNS)
    .eq("kind", "device")
    .eq("status", "paid")
    .neq("fulfilment", "delivered")
    .order("paid_at", { ascending: true })
    .limit(200);

  return (data ?? []).map(toOrder);
}

/** What one buyer is waiting for, newest first. */
export async function listOwnOrders(userId: string): Promise<DeviceOrder[]> {
  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("orders")
    .select(COLUMNS)
    .eq("kind", "device")
    .eq("user_id", userId)
    .in("status", ["pending", "paid"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map(toOrder);
}

/** How many orders are waiting on somebody here, for the cabinet's badge. */
export async function countQueue(): Promise<number> {
  if (!supabaseAdmin) return 0;

  const { count } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("kind", "device")
    .eq("status", "paid")
    .neq("fulfilment", "delivered");

  return count ?? 0;
}

/**
 * Settle a device order with no provider behind it.
 *
 * The same concession the claim flow makes: without merchant keys the site has
 * to stay usable, in development and in the window before certification
 * finishes. It goes through the ordinary paid path — the state it lands in and
 * the notice it raises are the ones a real payment produces — so nothing
 * downstream has to know which of the two happened.
 */
export async function settleWithoutProvider(
  userId: string,
  orderId: string,
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("kind", "device")
    // Conditional on pending, so this is a no-op the second time exactly as a
    // provider retry is.
    .eq("status", "pending")
    .select("id, handle, device_type")
    .maybeSingle();

  if (!data) return false;

  announcePaidDeviceOrder({
    id: data.id,
    handle: data.handle,
    deviceType: String(data.device_type ?? ""),
  });

  return true;
}

/** One order, as its buyer. Ownership is a filter, so a guessed id is nothing. */
export async function getOwnOrder(
  userId: string,
  orderId: string,
): Promise<DeviceOrder | null> {
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from("orders")
    .select(COLUMNS)
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("kind", "device")
    .maybeSingle();

  return data ? toOrder(data) : null;
}
