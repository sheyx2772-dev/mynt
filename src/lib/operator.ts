import "server-only";

import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";

// Who runs the shop.
//
// Every other screen here belongs to whoever owns the number in the address,
// and `requireOwnHandle` is the door for those. The fulfilment queue is the
// first screen that belongs to us rather than to a customer: it lists what to
// manufacture and the addresses to post it to, which is other people's personal
// data and none of a customer's business.
//
// So it is one account, named by its Supabase user id in the environment rather
// than by a flag on a row. A boolean column called `is_admin` is a column that
// can be set; an id that only exists in the deployment's own configuration
// cannot be granted by anything the application does.

/** The id in the environment, or null when nobody has been named. */
export function operatorUserId(): string | null {
  const id = process.env.FLEX_OPERATOR_USER_ID?.trim();
  return id ? id : null;
}

export function isOperator(userId: string | null | undefined): boolean {
  const operator = operatorUserId();
  return Boolean(operator && userId && userId === operator);
}

/**
 * The door to the queue.
 *
 * A 404 rather than a 403, for the same reason ownership checks 404: a page
 * that says "forbidden" has confirmed it exists. And an unset
 * FLEX_OPERATOR_USER_ID closes the door rather than opening it — a deployment
 * that has not been told who the operator is must not decide that everybody is.
 */
export async function requireOperator(path: string): Promise<{ userId: string }> {
  const user = await requireUser(path);
  if (!isOperator(user.id)) notFound();
  return { userId: user.id };
}
