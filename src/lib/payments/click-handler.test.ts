import { describe, it, expect } from "vitest";
import { handleClickPrepare, handleClickComplete } from "./click-handler";
import { FakePaymentStore } from "./fake-store";
import { clickSignString, CLICK_ERROR, CLICK_ACTION, type ClickRequest } from "./click";
import type { Order } from "./store";

const SECRET = "secret";
const PRICE = 99_000;

function order(overrides: Partial<Order> = {}): Order {
  return { id: "order-1", userId: "u1", handle: "MYN042", amount: PRICE, status: "pending", ...overrides };
}

function store(...orders: Order[]) {
  return new FakePaymentStore(orders.length ? orders : [order()]);
}

function signed(overrides: Partial<ClickRequest> = {}): ClickRequest {
  const req: ClickRequest = {
    click_trans_id: "click-1",
    service_id: "svc",
    merchant_trans_id: "order-1",
    amount: String(PRICE),
    action: CLICK_ACTION.PREPARE,
    sign_time: "2026-08-30 12:00:00",
    sign_string: "",
    ...overrides,
  };
  req.sign_string = clickSignString(req, SECRET);
  return req;
}

describe("handleClickPrepare", () => {
  it("accepts a valid request and returns merchant_prepare_id", async () => {
    const res = await handleClickPrepare(store(), signed(), SECRET);
    expect(res).toMatchObject({
      error: CLICK_ERROR.SUCCESS,
      merchant_trans_id: "order-1",
      merchant_prepare_id: "order-1",
    });
  });

  it("rejects a bad signature", async () => {
    const res = await handleClickPrepare(store(), { ...signed(), sign_string: "x".repeat(32) }, SECRET);
    expect(res.error).toBe(CLICK_ERROR.SIGN_CHECK_FAILED);
  });

  it("rejects a tampered amount even when otherwise well formed", async () => {
    const req = signed();
    const res = await handleClickPrepare(store(), { ...req, amount: "1" }, SECRET);
    // The signature covers the amount, so tampering fails there first.
    expect(res.error).toBe(CLICK_ERROR.SIGN_CHECK_FAILED);
  });

  it("rejects an amount that disagrees with the order", async () => {
    const res = await handleClickPrepare(store(order({ amount: 1000 })), signed(), SECRET);
    expect(res.error).toBe(CLICK_ERROR.INCORRECT_AMOUNT);
  });

  it("rejects an unknown order", async () => {
    const res = await handleClickPrepare(store(), signed({ merchant_trans_id: "nope" }), SECRET);
    expect(res.error).toBe(CLICK_ERROR.USER_NOT_FOUND);
  });

  it("reports an already-paid order", async () => {
    const res = await handleClickPrepare(store(order({ status: "paid" })), signed(), SECRET);
    expect(res.error).toBe(CLICK_ERROR.ALREADY_PAID);
  });

  it("fails closed when the secret is missing", async () => {
    const res = await handleClickPrepare(store(), signed(), "");
    expect(res.error).toBe(CLICK_ERROR.SIGN_CHECK_FAILED);
  });
});

describe("handleClickComplete", () => {
  function completeReq(overrides: Partial<ClickRequest> = {}): ClickRequest {
    const req: ClickRequest = {
      click_trans_id: "click-1",
      service_id: "svc",
      merchant_trans_id: "order-1",
      merchant_prepare_id: "order-1",
      amount: String(PRICE),
      action: CLICK_ACTION.COMPLETE,
      sign_time: "2026-08-30 12:05:00",
      error: "0",
      sign_string: "",
      ...overrides,
    };
    req.sign_string = clickSignString(req, SECRET);
    return req;
  }

  it("settles the order exactly once", async () => {
    const s = store();
    const res = await handleClickComplete(s, completeReq(), SECRET);

    expect(res).toMatchObject({ error: CLICK_ERROR.SUCCESS, merchant_confirm_id: "order-1" });
    expect(s.paidCalls).toEqual([{ orderId: "order-1", provider: "click", txId: "click-1" }]);
  });

  it("is idempotent on retry", async () => {
    const s = store();
    await handleClickComplete(s, completeReq(), SECRET);
    const again = await handleClickComplete(s, completeReq(), SECRET);

    expect(again.error).toBe(CLICK_ERROR.SUCCESS);
    expect(s.paidCalls).toHaveLength(1);
  });

  // The Complete signature includes merchant_prepare_id; a request signed
  // without it — the shape an earlier implementation produced — must not pass.
  it("rejects a signature computed without merchant_prepare_id", async () => {
    const req = completeReq();
    const withoutPrepareId = { ...req };
    delete (withoutPrepareId as Partial<ClickRequest>).merchant_prepare_id;
    req.sign_string = clickSignString(withoutPrepareId as ClickRequest, SECRET);

    const res = await handleClickComplete(store(), req, SECRET);
    expect(res.error).toBe(CLICK_ERROR.SIGN_CHECK_FAILED);
  });

  it("cancels the order when Click reports a failure", async () => {
    const s = store();
    const res = await handleClickComplete(s, completeReq({ error: "-5" }), SECRET);

    expect(res.error).toBe(CLICK_ERROR.TRANSACTION_CANCELLED);
    expect(s.cancelledCalls).toEqual(["order-1"]);
    expect(s.paidCalls).toHaveLength(0);
  });

  it("refuses to settle a cancelled order", async () => {
    const s = store(order({ status: "cancelled" }));
    const res = await handleClickComplete(s, completeReq(), SECRET);

    expect(res.error).toBe(CLICK_ERROR.TRANSACTION_CANCELLED);
    expect(s.paidCalls).toHaveLength(0);
  });

  it("rejects a bad signature", async () => {
    const res = await handleClickComplete(store(), { ...completeReq(), sign_string: "0".repeat(32) }, SECRET);
    expect(res.error).toBe(CLICK_ERROR.SIGN_CHECK_FAILED);
  });
});
