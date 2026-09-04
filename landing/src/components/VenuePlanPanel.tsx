"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FileText, Check } from "lucide-react";

import { issueInvoiceAction, type IssueState } from "@/app/kabinet/[handle]/obuna/actions";
import { MONTH_OPTIONS, venueInvoiceTotal, type VenueInvoice } from "@/lib/venue-plan";
import { formatUZS } from "@/lib/format";

// Buying another few months.
//
// The term is a row of four buttons rather than a select, because the only
// decision is how long, and the price of each is visible before it is chosen —
// a longer term costing proportionally the same is worth showing plainly rather
// than dressing up as a discount that is not there.

const idle: IssueState = { ok: true };

export default function VenuePlanPanel({
  handle,
  points,
  monthly,
  invoices,
}: {
  handle: string;
  points: number;
  /** Null when the venue is large enough that the price is a conversation. */
  monthly: number | null;
  invoices: VenueInvoice[];
}) {
  const [months, setMonths] = useState<number>(3);
  const [state, action, busy] = useActionState(issueInvoiceAction, idle);

  return (
    <div>
      {monthly === null ? (
        <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-flex-black/60">
          {points} ta nuqta — bu o&apos;lchamdagi obyekt uchun narx alohida kelishiladi.
          Biz bilan bog&apos;laning, hisob-fakturani qo&apos;lda yozamiz.
        </div>
      ) : (
        <form action={action} className="rounded-2xl border border-black/10 bg-white p-5">
          <input type="hidden" name="handle" value={handle} />
          <input type="hidden" name="months" value={months} />

          <p className="text-sm text-flex-black/60">
            {points} ta nuqta —{" "}
            <strong className="font-medium text-flex-black">
              {formatUZS(monthly)}
            </strong>{" "}
            oyiga.
          </p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {MONTH_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMonths(option)}
                aria-pressed={months === option}
                className={
                  months === option
                    ? "rounded-xl bg-flex-black px-3 py-3 font-tabular text-sm font-medium text-white"
                    : "rounded-xl border border-black/10 px-3 py-3 font-tabular text-sm text-flex-black/60 hover:bg-black/[0.03]"
                }
              >
                {option} oy
              </button>
            ))}
          </div>

          <p className="mt-4 font-display font-tabular text-2xl font-semibold">
            {formatUZS(venueInvoiceTotal(points, months, monthly).total)}
          </p>

          {!state.ok && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
          {state.ok && state.issued && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-lime-ink">
              <Check className="h-4 w-4" />
              №{state.issued} hisob-faktura tayyor — quyida.
            </p>
          )}

          <button
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-lime px-5 py-3.5 font-medium text-flex-black disabled:opacity-60"
          >
            {busy ? "Yozilmoqda…" : "Hisob-faktura olish"}
          </button>

          {/* Said before they press it, not after: nothing here takes money,
              and a cafe expecting a card form should know that now. */}
          <p className="mt-3 text-xs leading-relaxed text-flex-black/45">
            Hisob-faktura chiqadi, siz bank orqali to&apos;laysiz. Pul kelgach muddat
            uzayadi — karta ma&apos;lumoti so&apos;ralmaydi.
          </p>
        </form>
      )}

      {invoices.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
            Hisob-fakturalar
          </h2>
          <div className="divide-y divide-black/6 rounded-2xl border border-black/10 bg-white">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/kabinet/${handle}/hisob/${invoice.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-black/[0.02]"
              >
                <FileText className="h-4 w-4 shrink-0 text-flex-black/35" />
                <span className="font-tabular text-sm font-medium">№{invoice.number}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-flex-black/50">
                  {invoice.months} oy · {invoice.points} nuqta
                </span>
                <span className="shrink-0 font-tabular text-sm">
                  {formatUZS(invoice.total)}
                </span>
                <span
                  className={
                    invoice.status === "paid"
                      ? "shrink-0 rounded-full bg-lime/25 px-2.5 py-1 text-xs font-medium text-flex-black/70"
                      : "shrink-0 rounded-full border border-black/10 px-2.5 py-1 text-xs text-flex-black/50"
                  }
                >
                  {invoice.status === "paid"
                    ? "To'langan"
                    : invoice.status === "cancelled"
                      ? "Bekor"
                      : "Kutilmoqda"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
