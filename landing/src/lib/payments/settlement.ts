import type { Order } from "./store";

// One order, one provider.
//
// A buyer is given both a Payme link and a Click link for the same order,
// because either is a reasonable way to pay and nobody knows which app they
// have. Nothing stopped them using both.
//
// The sequence that charged somebody twice: open Payme, which creates a
// transaction and holds it for up to twelve hours; get bored; pay with Click,
// which settles the order; then let Payme perform. Payme's perform checked only
// its own transaction state, and Click's complete answered success for an order
// that was already paid — so both providers debited a card for one number.
//
// This is the check both of them were missing. It is deliberately not "is the
// order paid": a provider retrying its own settlement must still get its own
// success, or it retries forever.
export function settledByAnother(order: Order, provider: "click" | "payme"): boolean {
  return order.status === "paid" && order.provider !== null && order.provider !== provider;
}
