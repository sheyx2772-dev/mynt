// What cancelling an order undoes.
//
// A pure decision, separate from the store that carries it out, because it is
// the part that was wrong and the part that a test can hold still. The store
// needs a live database; this needs nothing.
//
// It was wrong in a way worth writing down. The rule used to be a guard on
// subscriptions with everything else falling through to "release the handle",
// which was correct while there were two kinds of order. `device` was added
// months later by migration 0043 and fell through it: a customer who owned
// AAA777 ordered a ring, the payment was refunded, and the release deleted
// their claimed, paid number — with the leads, comments, menu, tags and
// recommendations that cascade off it.
//
// So this names every kind, and anything it does not recognise does nothing. A
// fourth kind arriving without this file being touched should leave a paid
// asset alone and be noticed, rather than destroy one by default.

export type OrderKind = "handle" | "subscription" | "device";

export type Cancellation =
  /** Give the number back to the pool. */
  | { undo: "release-handle" }
  /** Take back the months a refunded renewal added. */
  | { undo: "subtract-months"; months: number }
  /** Nothing about the number changes. */
  | { undo: "nothing" };

export function cancellationEffect(
  kind: string | null | undefined,
  status: string | null | undefined,
  months: number | null | undefined,
): Cancellation {
  switch (kind) {
    case "handle":
      // Covers a refund after payment too: the buyer got their money back, so
      // they do not keep the number.
      return { undo: "release-handle" };

    case "subscription":
      // The number was bought separately and is the owner's. Deleting it
      // because a 49,000 so'm renewal was refunded would destroy a paid asset
      // over a monthly fee.
      //
      // And only a refund needs undoing: an order cancelled before it was paid
      // never extended anything, so subtracting would take time the owner paid
      // for on a previous order.
      return status === "paid"
        ? { undo: "subtract-months", months: months ?? 1 }
        : { undo: "nothing" };

    case "device":
      // A physical thing ordered against a number the buyer already owns.
      // Cancelling the ring does not cancel the number.
      return { undo: "nothing" };

    default:
      return { undo: "nothing" };
  }
}
