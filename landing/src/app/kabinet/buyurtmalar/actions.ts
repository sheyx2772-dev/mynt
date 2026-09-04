"use server";

import { revalidatePath } from "next/cache";

import { requireOperator } from "@/lib/operator";
import { advanceOrder } from "@/lib/device-orders";

/**
 * Move one order to the next state.
 *
 * The operator door is here rather than only on the page: a page check protects
 * a page, and an action is reachable without ever rendering one.
 */
export async function moveOrder(form: FormData): Promise<void> {
  await requireOperator("/kabinet/buyurtmalar");

  const orderId = String(form.get("orderId") ?? "");
  const to = String(form.get("to") ?? "");

  await advanceOrder(orderId, to);
  revalidatePath("/kabinet/buyurtmalar");
}
