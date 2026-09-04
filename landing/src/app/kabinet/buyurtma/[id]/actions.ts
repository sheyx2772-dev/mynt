"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { parseDelivery, type DeliveryField } from "@/lib/delivery";
import { setDeliveryAddress } from "@/lib/device-orders";

export type DeliveryState = {
  errors?: Partial<Record<DeliveryField, string>>;
  error?: string;
  saved?: true;
};

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

  const parsed = parseDelivery(form);
  if (!parsed.ok) return { errors: parsed.errors };

  const result = await setDeliveryAddress(user.id, orderId, parsed.delivery);

  if (!result.ok) {
    return {
      error:
        result.error === "notFound"
          ? "Bu buyurtmaga manzil yozib bo'lmaydi — u allaqachon yo'lda bo'lishi mumkin."
          : "Saqlanmadi. Yana urinib ko'ring.",
    };
  }

  revalidatePath(`/kabinet/buyurtma/${orderId}`);
  return { saved: true };
}
