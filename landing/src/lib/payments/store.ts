// The data operations the provider handlers need, expressed as an interface so
// the protocol logic can be exercised against an in-memory fake. The Payme
// sandbox tests a strict state machine, and it is far cheaper to prove that
// here than against a live database.

export type Order = {
  id: string;
  userId: string;
  handle: string;
  amount: number; // so'm
  status: "pending" | "paid" | "cancelled" | "failed";
  /**
   * Which provider settled it, once one has.
   *
   * Read by both handlers before they settle, because one order is offered to
   * both: a buyer can open Payme, leave it held, pay with Click, and then let
   * Payme perform. Without this the second one answers success and the card is
   * charged twice for one number.
   */
  provider: "click" | "payme" | null;
};

export type PaymeTransaction = {
  id: string; // Payme's id
  orderId: string;
  amount: number; // tiyin
  state: 1 | 2 | -1 | -2;
  createTime: number;
  performTime: number;
  cancelTime: number;
  reason: number | null;
};

export type ClickTransaction = {
  id: string; // click_trans_id
  orderId: string;
  amount: number; // so'm
  preparedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
};

export interface PaymentStore {
  findOrder(orderId: string): Promise<Order | null>;

  // Marks the order paid and turns the handle reservation into a claim.
  // Must be idempotent: providers retry, and Payme may call Perform twice.
  markOrderPaid(orderId: string, provider: "click" | "payme", providerTxId: string): Promise<void>;

  /**
   * Whether the number this order is for is still held by the buyer.
   *
   * Asked before a provider is allowed to take money. A reservation lasts
   * thirty minutes and a bank transfer does not always: the buyer opens the
   * payment page, the reservation lapses, somebody else buys the number, and
   * the first buyer's payment then arrives for a number that is no longer
   * theirs. Refusing here means the card is not charged, rather than charged
   * and refunded afterwards by somebody who noticed.
   *
   * One question covers all three kinds of order, because all three answer it
   * the same way: is there a row in `handles` for this number belonging to this
   * buyer. A lapsed reservation was deleted or was taken over, and either way
   * the answer is no.
   */
  isHandleStillHeld(orderId: string): Promise<boolean>;

  // Releases the reservation so the handle returns to the pool.
  markOrderCancelled(orderId: string): Promise<void>;

  findPaymeTransaction(id: string): Promise<PaymeTransaction | null>;
  findPaymeTransactionByOrder(orderId: string): Promise<PaymeTransaction | null>;
  createPaymeTransaction(tx: PaymeTransaction): Promise<void>;
  updatePaymeTransaction(id: string, patch: Partial<PaymeTransaction>): Promise<void>;

  findClickTransaction(id: string): Promise<ClickTransaction | null>;
  createClickTransaction(tx: ClickTransaction): Promise<void>;
  updateClickTransaction(id: string, patch: Partial<ClickTransaction>): Promise<void>;
}
