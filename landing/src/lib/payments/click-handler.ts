import { CLICK_ERROR, CLICK_ACTION, verifyClickSignature, clickAmountMatches, type ClickRequest } from "./click";
import type { PaymentStore } from "./store";

// Click's SHOP API: Prepare reserves, Complete settles. Both answers are plain
// JSON with a numeric `error` field — Click treats a non-zero value as a
// refusal, so failures are reported in the body, not as an HTTP status.

export type ClickResponse = {
  click_trans_id?: string;
  merchant_trans_id?: string;
  merchant_prepare_id?: string;
  merchant_confirm_id?: string;
  error: number;
  error_note: string;
};

export async function handleClickPrepare(
  store: PaymentStore,
  body: ClickRequest,
  secretKey: string,
  now: () => number = Date.now
): Promise<ClickResponse> {
  if (!verifyClickSignature({ ...body, action: CLICK_ACTION.PREPARE }, secretKey)) {
    return { error: CLICK_ERROR.SIGN_CHECK_FAILED, error_note: "Invalid signature" };
  }

  const order = await store.findOrder(body.merchant_trans_id);
  if (!order) {
    return { error: CLICK_ERROR.USER_NOT_FOUND, error_note: "Order not found" };
  }

  if (!clickAmountMatches(body.amount, order.amount)) {
    return { error: CLICK_ERROR.INCORRECT_AMOUNT, error_note: "Incorrect amount" };
  }

  if (order.status === "paid") {
    return { error: CLICK_ERROR.ALREADY_PAID, error_note: "Already paid" };
  }

  if (order.status !== "pending") {
    return { error: CLICK_ERROR.TRANSACTION_CANCELLED, error_note: "Order is not payable" };
  }

  if (!(await store.findClickTransaction(body.click_trans_id))) {
    await store.createClickTransaction({
      id: body.click_trans_id,
      orderId: order.id,
      amount: order.amount,
      preparedAt: new Date(now()).toISOString(),
      completedAt: null,
      cancelledAt: null,
    });
  }

  return {
    click_trans_id: body.click_trans_id,
    merchant_trans_id: order.id,
    // Click echoes this back in Complete, and it is part of that signature.
    merchant_prepare_id: order.id,
    error: CLICK_ERROR.SUCCESS,
    error_note: "Success",
  };
}

export async function handleClickComplete(
  store: PaymentStore,
  body: ClickRequest,
  secretKey: string,
  now: () => number = Date.now
): Promise<ClickResponse> {
  if (!verifyClickSignature({ ...body, action: CLICK_ACTION.COMPLETE }, secretKey)) {
    return { error: CLICK_ERROR.SIGN_CHECK_FAILED, error_note: "Invalid signature" };
  }

  const order = await store.findOrder(body.merchant_trans_id);
  if (!order) {
    return { error: CLICK_ERROR.USER_NOT_FOUND, error_note: "Order not found" };
  }

  // Click reports its own failure by sending a negative error code.
  if (Number(body.error) < 0) {
    if (order.status === "pending") {
      await store.markOrderCancelled(order.id);
      await store.updateClickTransaction(body.click_trans_id, {
        cancelledAt: new Date(now()).toISOString(),
      });
    }
    return {
      click_trans_id: body.click_trans_id,
      merchant_trans_id: order.id,
      error: CLICK_ERROR.TRANSACTION_CANCELLED,
      error_note: "Transaction cancelled",
    };
  }

  if (!clickAmountMatches(body.amount, order.amount)) {
    return { error: CLICK_ERROR.INCORRECT_AMOUNT, error_note: "Incorrect amount" };
  }

  if (order.status === "cancelled" || order.status === "failed") {
    return { error: CLICK_ERROR.TRANSACTION_CANCELLED, error_note: "Transaction cancelled" };
  }

  // Retries must not settle the order twice.
  if (order.status === "pending") {
    await store.markOrderPaid(order.id, "click", body.click_trans_id);
    await store.updateClickTransaction(body.click_trans_id, {
      completedAt: new Date(now()).toISOString(),
    });
  }

  return {
    click_trans_id: body.click_trans_id,
    merchant_trans_id: order.id,
    merchant_confirm_id: order.id,
    error: CLICK_ERROR.SUCCESS,
    error_note: "Success",
  };
}
