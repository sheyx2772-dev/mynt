import "server-only";

import { asReader } from "@/lib/backend/client";

import { VAT } from "@/lib/company";
import { venueMonthly, bandFor } from "@/lib/venues";
import { venueInvoiceTotal, type MonthOption, type VenueInvoice } from "@/lib/venue-plan";

// Re-exported so a server caller keeps one import for the whole subject.
export {
  MONTH_OPTIONS,
  isMonthOption,
  planState,
  venueInvoiceTotal,
  type MonthOption,
  type PlanState,
  type VenueInvoice,
} from "@/lib/venue-plan";

// What a venue owes, and the document it pays against.
//
// Nothing here charges anybody. The invoice is issued, the cafe's accountant
// transfers against it, and the venue is extended when the money lands — which
// is how every other supplier in the country is paid, and the reason a card
// gateway being uncertified does not stop us selling this today.

export async function listVenueInvoices(handle: string): Promise<VenueInvoice[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/hisoblar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.hisoblar ?? []).map(toInvoice);
}

/**
 * One invoice.
 *
 * Looked up by id and by the reader's account together, so a guessed id
 * belonging to somebody else's cafe is a 404 rather than their prices.
 */
export async function getVenueInvoice(id: string): Promise<VenueInvoice | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/hisoblar/{id}", { params: { path: { id } } });
  return error || !data ? null : toInvoice(data.hisob);
}

type BackendInvoice = {
  id: string;
  raqam: number;
  nuqtalar: number;
  oylar: number;
  oylik: number;
  qqs_foizi: number;
  jami: number;
  holat: string;
  berilgan: string;
  tolangan?: string;
};

function toInvoice(i: BackendInvoice): VenueInvoice {
  return {
    id: i.id,
    number: i.raqam,
    points: i.nuqtalar,
    months: i.oylar as MonthOption,
    monthly: i.oylik,
    vatPercent: i.qqs_foizi,
    total: i.jami,
    status: i.holat as VenueInvoice["status"],
    issuedAt: i.berilgan,
    paidAt: i.tolangan ?? null,
  };
}

export type IssueResult =
  | { ok: true; invoice: VenueInvoice }
  | { ok: false; error: "negotiated" | "failed" };

/**
 * Issuing one.
 *
 * The figures are worked out here, beside the price list, and copied onto the
 * row by the backend — the list will change and a document has to keep saying
 * what it said when it was issued.
 */
export async function issueVenueInvoice(
  handle: string,
  points: number,
  months: MonthOption,
  vatPercent = VAT.percent,
): Promise<IssueResult> {
  const monthly = venueMonthly(points);
  // The largest band has no price on purpose: a chain wants a conversation
  // about hardware, branding and terms, and an invoice generated behind its
  // back would be the wrong opening move.
  if (monthly === null) return { ok: false, error: "negotiated" };

  const { total } = venueInvoiceTotal(points, months, monthly, vatPercent);

  const client = await asReader();
  const { data, error } = await client.POST("/raqamlar/{raqam}/hisoblar", {
    params: { path: { raqam: handle } },
    body: {
      nuqtalar: Math.max(1, points),
      oylar: months,
      oylik: monthly,
      qqs_foizi: vatPercent,
      jami: total,
    },
  });
  if (error || !data) return { ok: false, error: "failed" };

  return { ok: true, invoice: toInvoice(data.hisob) };
}

/** Which band a venue of this size falls into, for the panel. */
export function venueBand(points: number) {
  return bandFor(points);
}

function rowToInvoice(row: Record<string, unknown>): VenueInvoice {
  return {
    id: row.id as string,
    number: Number(row.number),
    points: Number(row.points),
    months: Number(row.months),
    monthly: Number(row.monthly),
    vatPercent: Number(row.vat_percent),
    total: Number(row.total),
    status: row.status as VenueInvoice["status"],
    issuedAt: row.issued_at as string,
    paidAt: (row.paid_at as string) ?? null,
  };
}
