import type { PaymentStore, Order, PaymeTransaction, ClickTransaction } from "./store";

// In-memory PaymentStore for tests. Records the calls that have side effects
// so a test can assert an order was settled exactly once.
export class FakePaymentStore implements PaymentStore {
  orders = new Map<string, Order>();
  paymeTransactions = new Map<string, PaymeTransaction>();
  clickTransactions = new Map<string, ClickTransaction>();
  paidCalls: { orderId: string; provider: string; txId: string }[] = [];
  cancelledCalls: string[] = [];

  constructor(orders: Order[] = []) {
    for (const order of orders) this.orders.set(order.id, order);
  }

  async findOrder(orderId: string) {
    return this.orders.get(orderId) ?? null;
  }

  async markOrderPaid(orderId: string, provider: "click" | "payme", providerTxId: string) {
    this.paidCalls.push({ orderId, provider, txId: providerTxId });
    const order = this.orders.get(orderId);
    if (order) order.status = "paid";
  }

  async markOrderCancelled(orderId: string) {
    this.cancelledCalls.push(orderId);
    const order = this.orders.get(orderId);
    if (order && order.status !== "paid") order.status = "cancelled";
  }

  async findPaymeTransaction(id: string) {
    return this.paymeTransactions.get(id) ?? null;
  }

  async findPaymeTransactionByOrder(orderId: string) {
    for (const tx of this.paymeTransactions.values()) {
      if (tx.orderId === orderId) return tx;
    }
    return null;
  }

  async createPaymeTransaction(tx: PaymeTransaction) {
    this.paymeTransactions.set(tx.id, { ...tx });
  }

  async updatePaymeTransaction(id: string, patch: Partial<PaymeTransaction>) {
    const tx = this.paymeTransactions.get(id);
    if (tx) this.paymeTransactions.set(id, { ...tx, ...patch });
  }

  async findClickTransaction(id: string) {
    return this.clickTransactions.get(id) ?? null;
  }

  async createClickTransaction(tx: ClickTransaction) {
    this.clickTransactions.set(tx.id, { ...tx });
  }

  async updateClickTransaction(id: string, patch: Partial<ClickTransaction>) {
    const tx = this.clickTransactions.get(id);
    if (tx) this.clickTransactions.set(id, { ...tx, ...patch });
  }
}
