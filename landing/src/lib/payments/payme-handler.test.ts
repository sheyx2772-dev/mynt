import { describe, it, expect } from "vitest";
import { handlePaymeRequest } from "./payme-handler";
import { FakePaymentStore } from "./fake-store";
import { PAYME_ERROR, PAYME_STATE, PAYME_TIMEOUT_MS, sumToTiyin } from "./payme";
import type { Order } from "./store";

const PRICE = 99_000; // so'm
const AMOUNT = sumToTiyin(PRICE); // tiyin
const T0 = 1_800_000_000_000;

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    userId: "user-1",
    handle: "MYN042",
    amount: PRICE,
    status: "pending",
    ...overrides,
  };
}

function store(...orders: Order[]) {
  return new FakePaymentStore(orders.length ? orders : [order()]);
}

const clock = (t: number) => () => t;

const create = (id = "tx-1", amount = AMOUNT, orderId = "order-1", time = T0) => ({
  id: 1,
  method: "CreateTransaction",
  params: { id, time, amount, account: { order_id: orderId } },
});

describe("CheckPerformTransaction", () => {
  it("allows a pending order with the right amount", async () => {
    const res = await handlePaymeRequest(store(), {
      id: 1,
      method: "CheckPerformTransaction",
      params: { amount: AMOUNT, account: { order_id: "order-1" } },
    });
    expect(res).toMatchObject({ result: { allow: true } });
  });

  it("rejects an unknown order", async () => {
    const res = await handlePaymeRequest(store(), {
      id: 1,
      method: "CheckPerformTransaction",
      params: { amount: AMOUNT, account: { order_id: "nope" } },
    });
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.INVALID_ACCOUNT } });
  });

  it("rejects a missing account", async () => {
    const res = await handlePaymeRequest(store(), {
      id: 1,
      method: "CheckPerformTransaction",
      params: { amount: AMOUNT },
    });
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.INVALID_ACCOUNT } });
  });

  it("rejects a wrong amount", async () => {
    const res = await handlePaymeRequest(store(), {
      id: 1,
      method: "CheckPerformTransaction",
      params: { amount: AMOUNT - 1, account: { order_id: "order-1" } },
    });
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.INVALID_AMOUNT } });
  });

  it("rejects an order that is already paid", async () => {
    const res = await handlePaymeRequest(store(order({ status: "paid" })), {
      id: 1,
      method: "CheckPerformTransaction",
      params: { amount: AMOUNT, account: { order_id: "order-1" } },
    });
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.CANT_PERFORM } });
  });
});

describe("CreateTransaction", () => {
  it("creates a transaction in the created state", async () => {
    const s = store();
    const res = await handlePaymeRequest(s, create(), clock(T0));
    expect(res).toMatchObject({
      result: { transaction: "order-1", state: PAYME_STATE.CREATED, create_time: T0 },
    });
    expect(s.paymeTransactions.size).toBe(1);
  });

  // Payme retries with the same id and compares the answer.
  it("is idempotent and returns the original create_time", async () => {
    const s = store();
    const first = await handlePaymeRequest(s, create(), clock(T0));
    const second = await handlePaymeRequest(s, create(), clock(T0 + 60_000));
    expect(second).toEqual(first);
    expect(s.paymeTransactions.size).toBe(1);
  });

  it("rejects a second transaction for the same order", async () => {
    const s = store();
    await handlePaymeRequest(s, create("tx-1"), clock(T0));
    const res = await handlePaymeRequest(s, create("tx-2"), clock(T0));
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.CANT_PERFORM } });
  });

  it("rejects a wrong amount", async () => {
    const res = await handlePaymeRequest(store(), create("tx-1", AMOUNT + 100), clock(T0));
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.INVALID_AMOUNT } });
  });

  it("cancels and refuses a transaction older than 12 hours", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    const res = await handlePaymeRequest(s, create(), clock(T0 + PAYME_TIMEOUT_MS + 1));
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.CANT_PERFORM } });
    expect(s.paymeTransactions.get("tx-1")!.state).toBe(PAYME_STATE.CANCELLED);
  });
});

describe("PerformTransaction", () => {
  const perform = (id = "tx-1") => ({ id: 2, method: "PerformTransaction", params: { id } });

  it("performs a created transaction and settles the order once", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    const res = await handlePaymeRequest(s, perform(), clock(T0 + 1000));

    expect(res).toMatchObject({
      result: { state: PAYME_STATE.PERFORMED, perform_time: T0 + 1000 },
    });
    expect(s.paidCalls).toEqual([{ orderId: "order-1", provider: "payme", txId: "tx-1" }]);
  });

  // A repeat must not charge the order a second time.
  it("is idempotent and does not settle twice", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    const first = await handlePaymeRequest(s, perform(), clock(T0 + 1000));
    const second = await handlePaymeRequest(s, perform(), clock(T0 + 5000));

    expect(second).toEqual(first);
    expect(s.paidCalls).toHaveLength(1);
  });

  it("rejects an unknown transaction", async () => {
    const res = await handlePaymeRequest(store(), perform("nope"), clock(T0));
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.TRANSACTION_NOT_FOUND } });
  });

  it("refuses to perform after the 12-hour window and cancels instead", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    const res = await handlePaymeRequest(s, perform(), clock(T0 + PAYME_TIMEOUT_MS + 1));

    expect(res).toMatchObject({ error: { code: PAYME_ERROR.CANT_PERFORM } });
    expect(s.paidCalls).toHaveLength(0);
    expect(s.paymeTransactions.get("tx-1")!.state).toBe(PAYME_STATE.CANCELLED);
  });

  it("refuses to perform a cancelled transaction", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    await handlePaymeRequest(s, { id: 3, method: "CancelTransaction", params: { id: "tx-1" } }, clock(T0));
    const res = await handlePaymeRequest(s, perform(), clock(T0));

    expect(res).toMatchObject({ error: { code: PAYME_ERROR.CANT_PERFORM } });
    expect(s.paidCalls).toHaveLength(0);
  });
});

describe("CancelTransaction", () => {
  const cancel = (id = "tx-1", reason = 3) => ({
    id: 4,
    method: "CancelTransaction",
    params: { id, reason },
  });

  // Before payment it is a cancellation; after payment it is a refund. Payme
  // checks that the two report different terminal states.
  it("uses state -1 before the payment is performed", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    const res = await handlePaymeRequest(s, cancel(), clock(T0 + 100));

    expect(res).toMatchObject({ result: { state: PAYME_STATE.CANCELLED, cancel_time: T0 + 100 } });
    expect(s.cancelledCalls).toEqual(["order-1"]);
  });

  it("uses state -2 after the payment is performed", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    await handlePaymeRequest(s, { id: 2, method: "PerformTransaction", params: { id: "tx-1" } }, clock(T0));
    const res = await handlePaymeRequest(s, cancel(), clock(T0 + 100));

    expect(res).toMatchObject({ result: { state: PAYME_STATE.CANCELLED_AFTER_PERFORM } });
  });

  it("is idempotent and keeps the original cancel_time", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    const first = await handlePaymeRequest(s, cancel(), clock(T0 + 100));
    const second = await handlePaymeRequest(s, cancel(), clock(T0 + 999));

    expect(second).toEqual(first);
  });

  it("rejects an unknown transaction", async () => {
    const res = await handlePaymeRequest(store(), cancel("nope"), clock(T0));
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.TRANSACTION_NOT_FOUND } });
  });
});

describe("CheckTransaction", () => {
  it("reports the stored timestamps and state", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    await handlePaymeRequest(s, { id: 2, method: "PerformTransaction", params: { id: "tx-1" } }, clock(T0 + 500));

    const res = await handlePaymeRequest(s, {
      id: 5,
      method: "CheckTransaction",
      params: { id: "tx-1" },
    });

    expect(res).toMatchObject({
      result: {
        transaction: "order-1",
        state: PAYME_STATE.PERFORMED,
        create_time: T0,
        perform_time: T0 + 500,
        cancel_time: 0,
      },
    });
  });

  // This is the method the earlier implementation could never answer: it was
  // looking the order up by account data that Payme does not send here.
  it("works from the transaction id alone, with no account in params", async () => {
    const s = store();
    await handlePaymeRequest(s, create(), clock(T0));
    const res = await handlePaymeRequest(s, {
      id: 5,
      method: "CheckTransaction",
      params: { id: "tx-1" },
    });
    expect(res).toMatchObject({ result: { state: PAYME_STATE.CREATED } });
  });

  it("rejects an unknown transaction", async () => {
    const res = await handlePaymeRequest(store(), {
      id: 5,
      method: "CheckTransaction",
      params: { id: "nope" },
    });
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.TRANSACTION_NOT_FOUND } });
  });
});

describe("unknown methods", () => {
  it("returns method not found", async () => {
    const res = await handlePaymeRequest(store(), { id: 9, method: "Nope", params: {} });
    expect(res).toMatchObject({ error: { code: PAYME_ERROR.METHOD_NOT_FOUND } });
  });
});
