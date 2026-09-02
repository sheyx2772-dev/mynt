import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
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

export async function listVenueInvoices(venueId: string): Promise<VenueInvoice[]> {
  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("venue_invoices")
    .select("id, number, points, months, monthly, vat_percent, total, status, issued_at, paid_at")
    .eq("venue_id", venueId)
    .order("issued_at", { ascending: false });

  return (data ?? []).map(rowToInvoice);
}

export async function getVenueInvoice(
  venueId: string,
  id: string,
): Promise<VenueInvoice | null> {
  if (!supabaseAdmin) return null;

  // Scoped to the venue rather than looked up by id alone, so a guessed id
  // belonging to somebody else's cafe is a 404 rather than their prices.
  const { data } = await supabaseAdmin
    .from("venue_invoices")
    .select("id, number, points, months, monthly, vat_percent, total, status, issued_at, paid_at")
    .eq("venue_id", venueId)
    .eq("id", id)
    .maybeSingle();

  return data ? rowToInvoice(data) : null;
}

export type IssueResult =
  | { ok: true; invoice: VenueInvoice }
  | { ok: false; error: "negotiated" | "failed" };

export async function issueVenueInvoice(
  venueId: string,
  points: number,
  months: MonthOption,
  vatPercent = VAT.percent,
): Promise<IssueResult> {
  if (!supabaseAdmin) return { ok: false, error: "failed" };

  const monthly = venueMonthly(points);
  // The largest band has no price on purpose: a chain wants a conversation
  // about hardware, branding and terms, and an invoice generated behind its
  // back would be the wrong opening move.
  if (monthly === null) return { ok: false, error: "negotiated" };

  const { total } = venueInvoiceTotal(points, months, monthly, vatPercent);

  const { data } = await supabaseAdmin
    .from("venue_invoices")
    .insert({
      venue_id: venueId,
      points: Math.max(1, points),
      months,
      // Copied, not referenced: the price list will change and this document
      // has to keep saying what it said.
      monthly,
      vat_percent: vatPercent,
      total,
    })
    .select("id, number, points, months, monthly, vat_percent, total, status, issued_at, paid_at")
    .single();

  return data ? { ok: true, invoice: rowToInvoice(data) } : { ok: false, error: "failed" };
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
