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
        <div className="rounded-2xl border border-ink-line bg-ink-s1 p-5 text-sm text-paper-2">
          {points} ta nuqta — bu o&apos;lchamdagi obyekt uchun narx alohida kelishiladi.
          Biz bilan bog&apos;laning, hisob-fakturani qo&apos;lda yozamiz.
        </div>
      ) : (
        <form action={action} className="rounded-2xl border border-ink-line bg-ink-s1 p-5">
          <input type="hidden" name="handle" value={handle} />
          <input type="hidden" name="months" value={months} />

          <p className="text-sm text-paper-2">
            {points} ta nuqta —{" "}
            <strong className="font-medium text-paper">
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
                    ? "rounded-xl bg-ink-s2 px-3 py-3 font-tabular text-sm font-medium text-paper"
                    : "rounded-xl border border-ink-line px-3 py-3 font-tabular text-sm text-paper-2 hover:bg-ink-s2"
                }
              >
                {option} oy
              </button>
            ))}
          </div>

          <p className="mt-4 font-display font-tabular text-2xl font-semibold">
            {formatUZS(venueInvoiceTotal(points, months, monthly).total)}
          </p>

          {!state.ok && <p className="mt-3 text-sm text-danger-ink">{state.error}</p>}
          {state.ok && state.issued && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-lime">
              <Check className="h-4 w-4" />
              №{state.issued} hisob-faktura tayyor — quyida.
            </p>
          )}

          <button
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-lime px-5 py-3.5 font-medium text-ink disabled:opacity-60"
          >
            {busy ? "Yozilmoqda…" : "Hisob-faktura olish"}
          </button>

          {/* Said before they press it, not after: nothing here takes money,
              and a cafe expecting a card form should know that now. */}
          <p className="mt-3 text-xs leading-relaxed text-paper-3">
            Hisob-faktura chiqadi, siz bank orqali to&apos;laysiz. Pul kelgach muddat
            uzayadi — karta ma&apos;lumoti so&apos;ralmaydi.
          </p>
        </form>
      )}

      {invoices.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-paper-3 uppercase">
            Hisob-fakturalar
          </h2>
          <div className="divide-y divide-ink-line rounded-2xl border border-ink-line bg-ink-s1">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/kabinet/${handle}/hisob/${invoice.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-s2"
              >
                <FileText className="h-4 w-4 shrink-0 text-paper-3" />
                <span className="font-tabular text-sm font-medium">№{invoice.number}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-paper-2">
                  {invoice.months} oy · {invoice.points} nuqta
                </span>
                <span className="shrink-0 font-tabular text-sm">
                  {formatUZS(invoice.total)}
                </span>
                <span
                  className={
                    invoice.status === "paid"
                      ? "shrink-0 rounded-full bg-lime/25 px-2.5 py-1 text-xs font-medium text-paper-2"
                      : "shrink-0 rounded-full border border-ink-line px-2.5 py-1 text-xs text-paper-2"
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
