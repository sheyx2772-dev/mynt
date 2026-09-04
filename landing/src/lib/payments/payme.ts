import { timingSafeEqual } from "node:crypto";

// Payme Merchant API — https://developer.help.paycom.uz/metody-merchant-api/
//
// Payme speaks JSON-RPC over a single endpoint and drives a transaction state
// machine. The merchant must persist each transaction: after CreateTransaction,
// Payme identifies it only by its own `id`, so CheckTransaction and
// CancelTransaction arrive with no account information. Without a stored
// id -> order mapping those methods cannot be answered, and the mandatory
// sandbox certification fails.

export const PAYME_ERROR = {
  // Transport / RPC level
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INSUFFICIENT_PRIVILEGE: -32504,
  // Merchant level
  INVALID_AMOUNT: -31001,
  INVALID_ACCOUNT: -31050,
  CANT_PERFORM: -31008,
  TRANSACTION_NOT_FOUND: -31003,
  CANT_CANCEL: -31007,
} as const;

export const PAYME_STATE = {
  CREATED: 1,
  PERFORMED: 2,
  CANCELLED: -1,
  CANCELLED_AFTER_PERFORM: -2,
} as const;

export type PaymeState = (typeof PAYME_STATE)[keyof typeof PAYME_STATE];

// Payme abandons a transaction that stays in the created state this long.
export const PAYME_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export type RpcRequest = {
  id: number | string;
  method: string;
  params: Record<string, unknown>;
};

export function rpcResult(id: RpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

/** What Payme shows the payer, in the three languages it asks for. */
export type PaymeMessage = { ru: string; uz: string; en: string };

/**
 * Messages a payer sees, in their own language.
 *
 * Payme renders these inside its own app, so the Russian field showing Uzbek
 * text is not a formatting detail — it is a Russian-speaking customer being
 * told, in a language they may not read, why their payment failed.
 *
 * Messages nobody but an integrator will ever see stay in one language, and
 * are passed as plain strings.
 */
export const PAYME_MESSAGE = {
  orderNotFound: {
    ru: "Заказ не найден",
    uz: "Buyurtma topilmadi",
    en: "Order not found",
  },
  wrongAmount: {
    ru: "Неверная сумма",
    uz: "Noto'g'ri summa",
    en: "Wrong amount",
  },
  orderClosed: {
    ru: "Заказ уже закрыт",
    uz: "Buyurtma allaqachon yopilgan",
    en: "This order is already closed",
  },
  otherTransactionOpen: {
    ru: "По этому заказу уже открыта другая транзакция",
    uz: "Buyurtma uchun boshqa tranzaksiya ochiq",
    en: "Another transaction is already open for this order",
  },
  transactionNotFound: {
    ru: "Транзакция не найдена",
    uz: "Tranzaksiya topilmadi",
    en: "Transaction not found",
  },
  wrongState: {
    ru: "Неверное состояние транзакции",
    uz: "Tranzaksiya holati mos emas",
    en: "The transaction is in the wrong state",
  },
  expired: {
    ru: "Срок транзакции истёк",
    uz: "Tranzaksiya muddati tugagan",
    en: "The transaction has expired",
  },
  cancelled: {
    ru: "Транзакция отменена",
    uz: "Tranzaksiya bekor qilingan",
    en: "The transaction was cancelled",
  },
} as const satisfies Record<string, PaymeMessage>;

export function rpcError(
  id: RpcRequest["id"],
  code: number,
  message: string | PaymeMessage,
  data?: string,
) {
  // The shape Payme requires is always three languages. A plain string means
  // the same text in all three, which is right for messages only an integrator
  // reads and wrong for anything a payer does.
  const body: PaymeMessage =
    typeof message === "string" ? { ru: message, uz: message, en: message } : message;

  return { jsonrpc: "2.0", id, error: { code, message: body, data } };
}

// Payme authenticates with HTTP Basic where the username is literally
// "Paycom" and the password is the merchant key.
export function verifyPaymeAuth(authorizationHeader: string | null, key: string): boolean {
  if (!key || !authorizationHeader) return false;

  const expected = `Basic ${Buffer.from(`Paycom:${key}`).toString("base64")}`;
  if (expected.length !== authorizationHeader.length) return false;

  return timingSafeEqual(Buffer.from(expected), Buffer.from(authorizationHeader));
}

// Amounts arrive in tiyin; orders are priced in so'm.
export function tiyinToSum(tiyin: number): number {
  return tiyin / 100;
}

export function sumToTiyin(sum: number): number {
  return Math.round(sum * 100);
}

export function paymeAmountMatches(receivedTiyin: unknown, expectedSum: number): boolean {
  return typeof receivedTiyin === "number" && receivedTiyin === sumToTiyin(expectedSum);
}

export function isTransactionExpired(createTimeMs: number, now: number): boolean {
  return now - createTimeMs > PAYME_TIMEOUT_MS;
}

// Cancelling a transaction that was already performed is a refund, and Payme
// distinguishes the two with different terminal states.
export function cancelledState(current: PaymeState): PaymeState {
  return current === PAYME_STATE.PERFORMED
    ? PAYME_STATE.CANCELLED_AFTER_PERFORM
    : PAYME_STATE.CANCELLED;
}

// Hosted checkout: Payme reads a base64 payload from the URL.
export function paymeCheckoutUrl(opts: {
  merchantId: string;
  orderId: string;
  amountSum: number;
  returnUrl?: string;
}): string {
  const parts = [
    `m=${opts.merchantId}`,
    `ac.order_id=${opts.orderId}`,
    `a=${sumToTiyin(opts.amountSum)}`,
  ];
  if (opts.returnUrl) parts.push(`c=${opts.returnUrl}`);

  const payload = Buffer.from(parts.join(";")).toString("base64");
  return `https://checkout.paycom.uz/${payload}`;
}
