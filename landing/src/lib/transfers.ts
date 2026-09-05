import "server-only";

import { asReader } from "@/lib/backend/client";


// Handing a handle to someone else.
//
// The offer is made to an email address, not to an account: the buyer usually
// does not have one yet, and requiring them to register before the seller can
// even make the offer puts the hardest step first.

export type Transfer = {
  id: string;
  handle: string;
  toEmail: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  createdAt: string;
  expiresAt: string;
};

export type TransferResult = { ok: true } | { ok: false; error: string };

type BackendTransfer = {
  id: string;
  raqam: string;
  kimga: string;
  holat: string;
  boshlangan: string;
  tugashi?: string;
};

function toTransfer(t: BackendTransfer): Transfer {
  return {
    id: t.id,
    handle: t.raqam,
    toEmail: t.kimga,
    status: t.holat as Transfer["status"],
    createdAt: t.boshlangan,
    expiresAt: t.tugashi ?? "",
  };
}

export async function listTransfersForHandle(handle: string): Promise<Transfer[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/otkazishlar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.otkazishlar ?? []).map(toTransfer);
}

/** What has been offered to this account's address. */
export async function listIncomingTransfers(): Promise<Transfer[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/men/otkazishlar", {});
  if (error || !data) return [];

  return (data.otkazishlar ?? []).map(toTransfer);
}

/**
 * Offering a number to somebody.
 *
 * By address rather than to an account, because the person receiving it may
 * not have one yet. The offer lapses after a week: an open transfer is a claim
 * on a number, and one left forever is a number in limbo.
 */
export async function offerTransfer(handle: string, toEmail: string): Promise<TransferResult> {
  const client = await asReader();
  const { error } = await client.POST("/raqamlar/{raqam}/otkazishlar", {
    params: { path: { raqam: handle } },
    body: { kimga: toEmail },
  });
  return error
    ? { ok: false, error: "Bu raqam sizniki emas yoki hali egallanmagan." }
    : { ok: true };
}

export async function cancelTransfer(id: string): Promise<TransferResult> {
  const client = await asReader();
  const { error } = await client.DELETE("/otkazishlar/{id}", { params: { path: { id } } });
  return error ? { ok: false, error: "Bekor qilinmadi." } : { ok: true };
}

/**
 * Accepting one.
 *
 * The number moves and the offer settles in one transaction on the backend:
 * an offer marked accepted without the number moving is a number nobody owns,
 * and a number moved without the offer settling can be accepted again.
 */
export async function acceptTransfer(id: string): Promise<TransferResult> {
  const client = await asReader();
  const { error } = await client.POST("/otkazishlar/{id}/qabul", {
    params: { path: { id } },
  });
  return error
    ? { ok: false, error: "Taklif topilmadi yoki muddati o'tgan." }
    : { ok: true };
}
