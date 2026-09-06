import "server-only";

import { asReader } from "@/lib/backend/client";

import { TEAM_SEAT_MONTHLY } from "@/lib/plans";
import { VAT } from "@/lib/company";

// Invoices for company accounts.
//
// A firm's money leaves a bank account against a document its accountant files,
// so this produces that document. Nothing here charges anybody: the invoice is
// issued, the company transfers, and the plan is switched on when the money
// lands — which is how every other supplier in the country is paid.

export type Invoice = {
  id: string;
  number: number;
  seats: number;
  months: number;
  seatMonthly: number;
  vatPercent: number;
  total: number;
  status: "issued" | "paid" | "cancelled";
  issuedAt: string;
  paidAt: string | null;
};

export type BuyerRequisites = {
  legalName: string | null;
  inn: string | null;
  address: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankMfo: string | null;
  director: string | null;
};

/**
 * What a company owes for a period.
 *
 * VAT is passed in rather than assumed. Printing "QQS 12%" on a document from a
 * company that is not registered for it, or leaving it off one that is, is a
 * problem for the buyer's accountant and for us — so it is a number somebody
 * decides, and zero means it was decided rather than forgotten.
 */
export function invoiceTotal(
  seats: number,
  months: number,
  seatMonthly: number = TEAM_SEAT_MONTHLY,
  vatPercent = 0,
): { net: number; vat: number; total: number } {
  const net = seats * months * seatMonthly;
  const vat = Math.round((net * vatPercent) / 100);
  return { net, vat, total: net + vat };
}

type BackendInvoice = {
  id: string;
  raqam: number;
  orinlar: number;
  oylar: number;
  orin_oylik: number;
  qqs_foizi: number;
  jami: number;
  holat: string;
  berilgan: string;
  tolangan?: string;
};

function toInvoice(i: BackendInvoice): Invoice {
  return {
    id: i.id,
    number: i.raqam,
    seats: i.orinlar,
    months: i.oylar,
    seatMonthly: i.orin_oylik,
    vatPercent: i.qqs_foizi,
    total: i.jami,
    status: i.holat as Invoice["status"],
    issuedAt: i.berilgan,
    paidAt: i.tolangan ?? null,
  };
}

export async function listInvoices(): Promise<Invoice[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/men/jamoa/hisoblar", {});
  if (error || !data) return [];

  return (data.hisoblar ?? []).map(toInvoice);
}

/**
 * One invoice, by id and by membership together — a guessed id belonging to
 * another company is a 404 rather than their figures.
 */
export async function getInvoice(id: string): Promise<Invoice | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/jamoa/hisoblar/{id}", { params: { path: { id } } });
  return error || !data ? null : toInvoice(data.hisob);
}

/**
 * Issuing one. Owner only — the backend's statement says so.
 *
 * The figures are worked out beside the price list and copied onto the row:
 * the list will change and a document has to keep saying what it said.
 */
export async function issueInvoice(
  seats: number,
  months: number,
  seatMonthly: number,
  vatPercent: number,
  total: number,
): Promise<Invoice | null> {
  const client = await asReader();
  const { data, error } = await client.POST("/men/jamoa/hisoblar", {
    body: {
      orinlar: seats,
      oylar: months,
      orin_oylik: seatMonthly,
      qqs_foizi: vatPercent,
      jami: total,
    },
  });
  return error || !data ? null : toInvoice(data.hisob);
}

export async function getBuyerRequisites(): Promise<BuyerRequisites | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/men/jamoa", {});
  if (error || !data?.jamoa) return null;

  const t = data.jamoa;
  return {
    legalName: t.yuridik_nom ?? null,
    inn: t.inn ?? null,
    address: t.manzil ?? null,
    bankName: t.bank ?? null,
    bankAccount: t.hisob ?? null,
    bankMfo: t.mfo ?? null,
    director: t.rahbar ?? null,
  };
}

/** Owner only: an invoice with somebody else's bank details is a fraud with our name on it. */
export async function saveBuyerRequisites(r: BuyerRequisites): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.PUT("/men/jamoa/rekvizitlar", {
    body: {
      yuridik_nom: r.legalName ?? undefined,
      inn: r.inn ?? undefined,
      manzil: r.address ?? undefined,
      bank: r.bankName ?? undefined,
      hisob: r.bankAccount ?? undefined,
      mfo: r.bankMfo ?? undefined,
      rahbar: r.director ?? undefined,
    },
  });
  return !error;
}
