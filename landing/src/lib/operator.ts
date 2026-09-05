import "server-only";

import { notFound } from "next/navigation";

import { asReader } from "@/lib/backend/client";

// Who runs the shop.
//
// Every other screen here belongs to whoever owns the number in the address,
// and `requireOwnHandle` is the door for those. The fulfilment queue is the
// first screen that belongs to us rather than to a customer: it lists what to
// manufacture and the addresses to post it to, which is other people's personal
// data and none of a customer's business.
//
// Who that is, is the backend's answer. It holds one account id in its own
// configuration — a boolean column called `is_admin` is a column that can be
// set; an id that only exists in a deployment's environment cannot be granted
// by anything the application does. Asking rather than keeping a second copy of
// the setting here means the two can never disagree.

/** Is the reader the operator? Used to decide whether to draw a link. */
export async function isOperator(): Promise<boolean> {
  const client = await asReader();
  const { response } = await client.GET("/navbat", {});
  return response?.ok === true;
}

/**
 * The door to the queue.
 *
 * A 404 rather than a 403, for the same reason ownership checks 404: a page
 * that says "forbidden" has confirmed it exists. The backend answers the same
 * way, so a customer who guesses the address gets the same nothing from both.
 */
export async function requireOperator(): Promise<void> {
  if (!(await isOperator())) notFound();
}
