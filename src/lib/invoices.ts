import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
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

export async function listInvoices(teamId: string): Promise<Invoice[]> {
  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("team_invoices")
    .select("id, number, seats, months, seat_monthly, vat_percent, total, status, issued_at, paid_at")
    .eq("team_id", teamId)
    .order("issued_at", { ascending: false });

  return (data ?? []).map(rowToInvoice);
}

export async function getInvoice(
  invoiceId: string,
  teamId: string,
): Promise<Invoice | null> {
  if (!supabaseAdmin) return null;

  // The team filter is the authorization: an invoice belonging to another
  // company is simply not found.
  const { data } = await supabaseAdmin
    .from("team_invoices")
    .select("id, number, seats, months, seat_monthly, vat_percent, total, status, issued_at, paid_at")
    .eq("id", invoiceId)
    .eq("team_id", teamId)
    .maybeSingle();

  return data ? rowToInvoice(data) : null;
}

export async function issueInvoice(
  teamId: string,
  seats: number,
  months: number,
  // Defaults to whatever the seller has settled on, so an invoice cannot be
  // issued at a rate nobody chose.
  vatPercent = VAT.percent,
): Promise<Invoice | null> {
  if (!supabaseAdmin) return null;

  const { total } = invoiceTotal(seats, months, TEAM_SEAT_MONTHLY, vatPercent);

  const { data } = await supabaseAdmin
    .from("team_invoices")
    .insert({
      team_id: teamId,
      seats,
      months,
      // Copied, not referenced: an invoice is a document, and what it says has
      // to stay what it said when the price list changes.
      seat_monthly: TEAM_SEAT_MONTHLY,
      vat_percent: vatPercent,
      total,
    })
    .select("id, number, seats, months, seat_monthly, vat_percent, total, status, issued_at, paid_at")
    .single();

  return data ? rowToInvoice(data) : null;
}

export async function getBuyerRequisites(teamId: string): Promise<BuyerRequisites | null> {
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from("teams")
    .select("legal_name, inn, address, bank_name, bank_account, bank_mfo, director")
    .eq("id", teamId)
    .maybeSingle();

  if (!data) return null;

  return {
    legalName: (data.legal_name as string) ?? null,
    inn: (data.inn as string) ?? null,
    address: (data.address as string) ?? null,
    bankName: (data.bank_name as string) ?? null,
    bankAccount: (data.bank_account as string) ?? null,
    bankMfo: (data.bank_mfo as string) ?? null,
    director: (data.director as string) ?? null,
  };
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    number: row.number as number,
    seats: row.seats as number,
    months: row.months as number,
    seatMonthly: Number(row.seat_monthly),
    vatPercent: Number(row.vat_percent),
    total: Number(row.total),
    status: row.status as Invoice["status"],
    issuedAt: row.issued_at as string,
    paidAt: (row.paid_at as string) ?? null,
  };
}
