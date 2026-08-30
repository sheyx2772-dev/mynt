import {
  PAYME_ERROR,
  PAYME_STATE,
  rpcResult,
  rpcError,
  isTransactionExpired,
  paymeAmountMatches,
  cancelledState,
  type RpcRequest,
} from "./payme";
import type { PaymentStore, PaymeTransaction } from "./store";

// Payme's Merchant API as a pure function of (store, request, clock), so the
// whole state machine can be tested without a database or a live account.
//
// The rules Payme's sandbox actually checks, and which are easy to get wrong:
//  - repeated calls must be idempotent and return the *same* timestamps;
//  - a transaction created more than 12 hours ago can no longer be performed;
//  - cancelling before payment is -1, cancelling after payment is -2;
//  - every method after CreateTransaction is addressed only by Payme's `id`,
//    so the id -> order mapping must be stored.

type Clock = () => number;

// Payme identifies our side by the order: it is what we quoted the price for.
function billingRef(tx: PaymeTransaction): string {
  return tx.orderId;
}

function txResult(id: RpcRequest["id"], tx: PaymeTransaction) {
  return rpcResult(id, {
    transaction: billingRef(tx),
    state: tx.state,
    create_time: tx.createTime,
    perform_time: tx.performTime,
    cancel_time: tx.cancelTime,
  });
}

export async function handlePaymeRequest(
  store: PaymentStore,
  request: RpcRequest,
  now: Clock = Date.now
): Promise<Record<string, unknown>> {
  const { id, method, params } = request;

  switch (method) {
    case "CheckPerformTransaction":
      return checkPerform(store, id, params);
    case "CreateTransaction":
      return createTransaction(store, id, params, now);
    case "PerformTransaction":
      return performTransaction(store, id, params, now);
    case "CancelTransaction":
      return cancelTransaction(store, id, params, now);
    case "CheckTransaction":
      return checkTransaction(store, id, params);
    default:
      return rpcError(id, PAYME_ERROR.METHOD_NOT_FOUND, "Method not found");
  }
}

function orderIdOf(params: Record<string, unknown>): string | null {
  const account = params.account as Record<string, unknown> | undefined;
  const value = account?.order_id;
  return typeof value === "string" && value ? value : null;
}

async function checkPerform(
  store: PaymentStore,
  id: RpcRequest["id"],
  params: Record<string, unknown>
) {
  const orderId = orderIdOf(params);
  if (!orderId) return rpcError(id, PAYME_ERROR.INVALID_ACCOUNT, "Buyurtma topilmadi");

  const order = await store.findOrder(orderId);
  if (!order) return rpcError(id, PAYME_ERROR.INVALID_ACCOUNT, "Buyurtma topilmadi");

  if (!paymeAmountMatches(params.amount, order.amount)) {
    return rpcError(id, PAYME_ERROR.INVALID_AMOUNT, "Noto'g'ri summa");
  }

  if (order.status !== "pending") {
    return rpcError(id, PAYME_ERROR.CANT_PERFORM, "Buyurtma allaqachon yopilgan");
  }

  return rpcResult(id, { allow: true });
}

async function createTransaction(
  store: PaymentStore,
  id: RpcRequest["id"],
  params: Record<string, unknown>,
  now: Clock
) {
  const txId = String(params.id ?? "");
  if (!txId) return rpcError(id, PAYME_ERROR.INVALID_REQUEST, "Transaction id is required");

  // Payme retries CreateTransaction with the same id; the answer must not drift.
  const existing = await store.findPaymeTransaction(txId);
  if (existing) {
    if (existing.state !== PAYME_STATE.CREATED) {
      return rpcError(id, PAYME_ERROR.CANT_PERFORM, "Tranzaksiya holati mos emas");
    }
    if (isTransactionExpired(existing.createTime, now())) {
      await store.updatePaymeTransaction(txId, {
        state: PAYME_STATE.CANCELLED,
        cancelTime: now(),
        reason: 4,
      });
      await store.markOrderCancelled(existing.orderId);
      return rpcError(id, PAYME_ERROR.CANT_PERFORM, "Tranzaksiya muddati tugagan");
    }
    return txResult(id, existing);
  }

  const orderId = orderIdOf(params);
  if (!orderId) return rpcError(id, PAYME_ERROR.INVALID_ACCOUNT, "Buyurtma topilmadi");

  const order = await store.findOrder(orderId);
  if (!order) return rpcError(id, PAYME_ERROR.INVALID_ACCOUNT, "Buyurtma topilmadi");

  if (!paymeAmountMatches(params.amount, order.amount)) {
    return rpcError(id, PAYME_ERROR.INVALID_AMOUNT, "Noto'g'ri summa");
  }

  if (order.status !== "pending") {
    return rpcError(id, PAYME_ERROR.CANT_PERFORM, "Buyurtma allaqachon yopilgan");
  }

  // One live transaction per order, or two payers could both succeed.
  const active = await store.findPaymeTransactionByOrder(orderId);
  if (active && (active.state === PAYME_STATE.CREATED || active.state === PAYME_STATE.PERFORMED)) {
    return rpcError(id, PAYME_ERROR.CANT_PERFORM, "Buyurtma uchun boshqa tranzaksiya ochiq");
  }

  const createTime = typeof params.time === "number" ? params.time : now();
  const tx: PaymeTransaction = {
    id: txId,
    orderId,
    amount: params.amount as number,
    state: PAYME_STATE.CREATED,
    createTime,
    performTime: 0,
    cancelTime: 0,
    reason: null,
  };
  await store.createPaymeTransaction(tx);

  return txResult(id, tx);
}

async function performTransaction(
  store: PaymentStore,
  id: RpcRequest["id"],
  params: Record<string, unknown>,
  now: Clock
) {
  const txId = String(params.id ?? "");
  const tx = await store.findPaymeTransaction(txId);
  if (!tx) return rpcError(id, PAYME_ERROR.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi");

  // Already performed — repeat the original answer rather than paying twice.
  if (tx.state === PAYME_STATE.PERFORMED) return txResult(id, tx);

  if (tx.state !== PAYME_STATE.CREATED) {
    return rpcError(id, PAYME_ERROR.CANT_PERFORM, "Tranzaksiya bekor qilingan");
  }

  if (isTransactionExpired(tx.createTime, now())) {
    await store.updatePaymeTransaction(txId, {
      state: PAYME_STATE.CANCELLED,
      cancelTime: now(),
      reason: 4,
    });
    await store.markOrderCancelled(tx.orderId);
    return rpcError(id, PAYME_ERROR.CANT_PERFORM, "Tranzaksiya muddati tugagan");
  }

  const performTime = now();
  await store.updatePaymeTransaction(txId, { state: PAYME_STATE.PERFORMED, performTime });
  await store.markOrderPaid(tx.orderId, "payme", txId);

  return txResult(id, { ...tx, state: PAYME_STATE.PERFORMED, performTime });
}

async function cancelTransaction(
  store: PaymentStore,
  id: RpcRequest["id"],
  params: Record<string, unknown>,
  now: Clock
) {
  const txId = String(params.id ?? "");
  const tx = await store.findPaymeTransaction(txId);
  if (!tx) return rpcError(id, PAYME_ERROR.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi");

  // Already cancelled — return the recorded result unchanged.
  if (tx.state === PAYME_STATE.CANCELLED || tx.state === PAYME_STATE.CANCELLED_AFTER_PERFORM) {
    return txResult(id, tx);
  }

  const state = cancelledState(tx.state);
  const cancelTime = now();
  const reason = typeof params.reason === "number" ? params.reason : null;

  await store.updatePaymeTransaction(txId, { state, cancelTime, reason });
  await store.markOrderCancelled(tx.orderId);

  return txResult(id, { ...tx, state, cancelTime, reason });
}

async function checkTransaction(
  store: PaymentStore,
  id: RpcRequest["id"],
  params: Record<string, unknown>
) {
  const txId = String(params.id ?? "");
  const tx = await store.findPaymeTransaction(txId);
  if (!tx) return rpcError(id, PAYME_ERROR.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi");

  return rpcResult(id, {
    transaction: billingRef(tx),
    state: tx.state,
    create_time: tx.createTime,
    perform_time: tx.performTime,
    cancel_time: tx.cancelTime,
    reason: tx.reason,
  });
}
