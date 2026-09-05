"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { parseDelivery, type DeliveryField } from "@/lib/delivery";
import { setDeliveryAddress } from "@/lib/device-orders";

export type DeliveryState = {
  errors?: Partial<Record<DeliveryField, string>>;
  error?: string;
  saved?: true;
  /**
   * What the buyer typed, handed back so the form can redraw it.
   *
   * React 19 resets an uncontrolled form once its action returns, and
   * returning an error counts as returning. Without this, one wrong digit in
   * the phone number emptied all four fields — of somebody who has already
   * paid and is now retyping their own address.
   */
  values?: Record<DeliveryField, string>;
};

function submitted(form: FormData): Record<DeliveryField, string> {
  const read = (k: DeliveryField) => String(form.get(k) ?? "").slice(0, 300);
  return {
    recipient: read("recipient"),
    phone: read("phone"),
    region: read("region"),
    address: read("address"),
  };
}

/**
 * Where to send it.
 *
 * The order id comes from the form and ownership is checked on the write, so a
 * guessed id updates no rows. The buyer is told what they got wrong, field by
 * field, in one pass — they have already paid, and this is the wrong moment to
 * make somebody guess.
 */
export async function saveDelivery(
  _previous: DeliveryState,
  form: FormData,
): Promise<DeliveryState> {
  const orderId = String(form.get("orderId") ?? "");
  const user = await requireUser(`/kabinet/buyurtma/${orderId}`);

  const values = submitted(form);
  const parsed = parseDelivery(form);
  if (!parsed.ok) return { errors: parsed.errors, values };

  const result = await setDeliveryAddress(orderId, parsed.delivery);

  if (!result.ok) {
    return {
      values,
      error:
        result.error === "notFound"
          ? "Bu buyurtmaga manzil yozib bo'lmaydi — u allaqachon yo'lda bo'lishi mumkin."
          : "Saqlanmadi. Yana urinib ko'ring.",
    };
  }

  revalidatePath(`/kabinet/buyurtma/${orderId}`);
  return { saved: true };
}
