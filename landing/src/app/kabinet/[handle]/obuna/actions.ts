"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getOwnedVenue } from "@/lib/menu";
import { issueVenueInvoice, isMonthOption } from "@/lib/venue-billing";

export type IssueState =
  | { ok: true; issued?: number }
  | { ok: false; error: string };

export async function issueInvoiceAction(
  _prev: IssueState,
  form: FormData,
): Promise<IssueState> {
  const user = await requireUser();
  const handle = String(form.get("handle") ?? "").toUpperCase();

  const venue = await getOwnedVenue(handle, user.id);
  if (!venue) return { ok: false, error: "Bu obyekt sizniki emas." };

  const months = Number(form.get("months"));
  if (!isMonthOption(months)) return { ok: false, error: "Muddatni tanlang." };

  // The band follows how many tags the venue actually has, so the document is
  // written against the venue as it stands rather than a number typed into a
  // form. A venue with no tags yet is charged as the smallest band.
  const points = Math.max(1, venue.points.length);

  const result = await issueVenueInvoice(venue.id, points, months);
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.error === "negotiated"
          ? "Bu o'lchamdagi obyekt uchun narx alohida kelishiladi — biz bilan bog'laning."
          : "Hisob-fakturani yaratib bo'lmadi.",
    };
  }

  revalidatePath(`/kabinet/${handle}/obuna`);
  return { ok: true, issued: result.invoice.number };
}
