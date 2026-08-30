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
