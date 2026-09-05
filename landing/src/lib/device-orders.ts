import "server-only";

import { asReader } from "@/lib/backend/client";
import type { Fulfilment } from "@/lib/fulfilment";
import type { Delivery } from "@/lib/delivery";
import type { DeviceTypeId } from "@/lib/devices";
import type { CardDesignId } from "@/lib/card-designs";

// Buying the object, and getting it to the person who bought it.
//
// Every call here carries the reader's own session, and the backend decides
// what that session may see: a buyer sees their own orders, the operator sees
// the queue. Nothing on this side can widen that — there is no key here that
// reads other people's addresses.
//
// The number and the device are priced separately — src/lib/plans.ts says why —
// and the price now comes from the backend's catalogue rather than from a form.

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

// What the backend sends. Its field names are Uzbek because its other reader is
// the phone app; the mapping happens once, here.
type Wire = {
  id: string;
  raqam: string;
  qurilma: string;
  dizayn?: string;
  summa: number;
  holat: string;
  bosqich: string;
  kimga?: string;
  telefon?: string;
  viloyat?: string;
  manzil?: string;
  izoh?: string;
  tolangan?: string;
  jonatilgan?: string;
  vaqt: string;
};

function toOrder(row: Wire): DeviceOrder {
  return {
    id: row.id,
    handle: row.raqam,
    deviceType: row.qurilma as DeviceTypeId,
    design: (row.dizayn as CardDesignId | undefined) ?? null,
    amount: row.summa,
    status: row.holat as DeviceOrder["status"],
    fulfilment: row.bosqich as Fulfilment,
    recipient: row.kimga ?? null,
    phone: row.telefon ?? null,
    region: row.viloyat ?? null,
    address: row.manzil ?? null,
    note: row.izoh ?? null,
    paidAt: row.tolangan ?? null,
    shippedAt: row.jonatilgan ?? null,
    createdAt: row.vaqt,
  };
}

export type PlaceResult =
  | { ok: true; orderId: string; amount: number }
  | { ok: false; error: "notOwned" | "unknownDevice" | "failed" };

/**
 * Order a device against a number the buyer already owns.
 *
 * The price is not sent. It is read from the backend's own catalogue, because a
 * posted amount is a discount anybody can grant themselves — and ownership is a
 * condition of the insert there, so a guessed handle writes nothing.
 */
export async function placeDeviceOrder(
  handle: string,
  deviceType: string,
  design: string | null,
): Promise<PlaceResult> {
  const client = await asReader();
  const { data, error, response } = await client.POST("/qurilmalar", {
    body: {
      raqam: handle,
      qurilma: deviceType as "card" | "ring" | "bracelet",
      dizayn: design ?? undefined,
    },
  });

  if (error || !data) {
    if (response?.status === 404) return { ok: false, error: "notOwned" };
    if (response?.status === 422) return { ok: false, error: "unknownDevice" };
    return { ok: false, error: "failed" };
  }

  return { ok: true, orderId: data.buyurtma.id, amount: data.buyurtma.summa };
}

export type AddressResult = { ok: true } | { ok: false; error: "notFound" | "failed" };

/**
 * Write the delivery address, and move the order into the queue.
 *
 * One request, because it is one write there: an order that has an address but
 * is still marked as needing one sits in the wrong list forever. Telling
 * whoever makes these is the backend's job too — it holds the notice table.
 */
export async function setDeliveryAddress(
  orderId: string,
  delivery: Delivery,
): Promise<AddressResult> {
  const client = await asReader();
  const { error, response } = await client.PUT("/qurilmalar/{id}/manzil", {
    params: { path: { id: orderId } },
    body: {
      kimga: delivery.recipient,
      telefon: delivery.phone,
      viloyat: delivery.region,
      manzil: delivery.address,
      izoh: delivery.note ?? undefined,
    },
  });

  if (!error) return { ok: true };
  // Not theirs, or it has already left `address_needed`. Both mean the form
  // being looked at is out of date.
  return { ok: false, error: response?.status === 404 ? "notFound" : "failed" };
}

/**
 * Move one order along.
 *
 * The allowed steps are drawn from src/lib/fulfilment.ts and enforced in Go.
 * The screen greys out what cannot be done, and the backend refuses it, because
 * a button is not a permission.
 */
export async function advanceOrder(
  orderId: string,
  to: string,
): Promise<{ ok: boolean }> {
  const client = await asReader();
  const { error } = await client.POST("/navbat/{id}/bosqich", {
    params: { path: { id: orderId } },
    body: { bosqich: to as Exclude<Fulfilment, "address_needed"> },
  });

  return { ok: !error };
}

/** The queue whoever makes these works from: paid, unfinished, oldest first. */
export async function listQueue(): Promise<DeviceOrder[]> {
  const client = await asReader();
  const { data } = await client.GET("/navbat", {});
  return (data?.buyurtmalar ?? []).map(toOrder);
}

/** How many orders are waiting on somebody here, for the cabinet's badge. */
export async function countQueue(): Promise<number> {
  const client = await asReader();
  const { data } = await client.GET("/navbat", {});
  return data?.jami ?? 0;
}

/** What one buyer is waiting for, newest first. */
export async function listOwnOrders(): Promise<DeviceOrder[]> {
  const client = await asReader();
  const { data } = await client.GET("/qurilmalar", {});
  return (data?.buyurtmalar ?? []).map(toOrder);
}

/**
 * Settle a device order with no provider behind it.
 *
 * The same concession the claim flow makes: without merchant keys the site has
 * to stay usable, in development and in the window before certification
 * finishes. The backend refuses it anywhere a provider is configured, so this
 * cannot become a way to get a ring for nothing in production.
 */
export async function settleWithoutProvider(orderId: string): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.POST("/qurilmalar/{id}/tolash", {
    params: { path: { id: orderId } },
  });
  return !error;
}

/** One order, as its buyer. Ownership is a filter, so a guessed id is nothing. */
export async function getOwnOrder(orderId: string): Promise<DeviceOrder | null> {
  const client = await asReader();
  const { data } = await client.GET("/qurilmalar/{id}", {
    params: { path: { id: orderId } },
  });
  return data ? toOrder(data.buyurtma) : null;
}
