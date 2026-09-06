"use server";

import { revalidatePath } from "next/cache";

import { requireOwnHandle } from "@/lib/kabinet";
import { placeDeviceOrder, settleWithoutProvider } from "@/lib/device-orders";
import { isDeviceType } from "@/lib/devices";
import { isCardDesign } from "@/lib/card-designs";

// Ordering the object, from the cabinet of the number it belongs to.
//
// The number is already owned by the time anybody gets here, which is what
// makes this simpler than the claim: there is no reservation to hold and
// nothing to release if the payment never arrives. An unpaid device order is
// just a row nobody acts on.

export type OrderState = {
  error?: string;
  /** Where to pay, when there is a provider to pay at. */
  checkout?: { click?: string; payme?: string };
  /** Where to write the address, once it is paid for. */
  next?: string;
};

export async function orderDevice(
  _previous: OrderState,
  form: FormData,
): Promise<OrderState> {
  const handleRaw = String(form.get("handle") ?? "");
  const { normalized } = await requireOwnHandle(
    handleRaw,
    "/kabinet/[handle]/qurilma",
  );

  const deviceType = String(form.get("deviceType") ?? "");
  const designRaw = String(form.get("cardDesign") ?? "");

  if (!isDeviceType(deviceType)) return { error: "Qurilmani tanlang." };

  // The design is optional on the order: a buyer may want the one already on
  // their profile. An unknown value is dropped rather than refused, because it
  // can only come from a tampered form and the profile's own design is the
  // right answer either way.
  const design = isCardDesign(designRaw) ? designRaw : null;

  const placed = await placeDeviceOrder(normalized, deviceType, design);

  if (!placed.ok) {
    return {
      error:
        placed.error === "notOwned"
          ? "Bu raqam sizga tegishli emas."
          : "Buyurtma qabul qilinmadi. Yana urinib ko'ring.",
    };
  }

  const addressPath = `/kabinet/buyurtma/${placed.orderId}`;
  revalidatePath(`/kabinet/${normalized}/qurilma`);

  // No payment addresses came back, so there is nothing configured to take
  // money. The order is settled the way a claim is in the same situation, and
  // the buyer goes straight to the address form.
  if (!placed.checkout.click && !placed.checkout.payme) {
    await settleWithoutProvider(placed.orderId);
    return { next: addressPath };
  }

  return { checkout: placed.checkout };
}
