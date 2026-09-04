"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestInvoice } from "@/app/kabinet/jamoa/actions";
import { TEAM_SEAT_MONTHLY, MIN_TEAM_SEATS } from "@/lib/plans";
import { formatUZS } from "@/lib/format";

// Asking for an invoice, with the total visible before the asking. A company
// deciding on twenty seats for a year wants the number on screen, not after a
// round trip.

const PERIODS = [
  { months: 1, label: "1 oy" },
  { months: 3, label: "3 oy" },
  { months: 6, label: "6 oy" },
  { months: 12, label: "12 oy" },
];

export default function InvoiceRequest({ currentSeats }: { currentSeats: number }) {
  const [seats, setSeats] = useState(Math.max(currentSeats, MIN_TEAM_SEATS));
  const [months, setMonths] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const total = seats * months * TEAM_SEAT_MONTHLY;

  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-5">
      <h3 className="text-xs font-medium tracking-[0.14em] text-flex-black/45 uppercase">
        Hisob-faktura
      </h3>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-flex-black/45">O&apos;rinlar</span>
          <input
            type="number"
            min={MIN_TEAM_SEATS}
            max={500}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="w-24 rounded-xl border border-black/10 bg-white px-3 py-2 font-tabular text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-flex-black/45">Muddat</span>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
          >
            {PERIODS.map((p) => (
              <option key={p.months} value={p.months}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto text-right">
          <p className="text-xs text-flex-black/45">Jami</p>
          <p className="font-display text-lg font-semibold tabular-nums">
            {formatUZS(total)}
          </p>
        </div>
      </div>

      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await requestInvoice(seats, months);
            if (result.ok && result.id) router.push(`/kabinet/jamoa/hisob/${result.id}`);
            else setError(result.error ?? "Bo'lmadi.");
          })
        }
        disabled={pending}
        className="mt-4 rounded-xl bg-flex-black px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-white uppercase disabled:opacity-50"
      >
        {pending ? "Tayyorlanmoqda" : "Hisob-faktura olish"}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <p className="mt-3 text-xs text-flex-black/40">
        Hujjat darhol tayyor bo&apos;ladi. Pul kelgach obuna uzaytiriladi.
      </p>
    </div>
  );
}
