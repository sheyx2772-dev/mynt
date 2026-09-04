"use client";

import { useTransition, useState } from "react";
import { Gift } from "lucide-react";
import { acceptHandleTransfer } from "@/app/kabinet/[handle]/actions";
import type { Transfer } from "@/lib/transfers";

// Offers waiting for this person. Shown at the top of the cabinet, because a
// handle someone is holding for you is the most interesting thing on the page.
export default function IncomingTransfers({ transfers }: { transfers: Transfer[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (transfers.length === 0) return null;

  return (
    <section className="mb-6 rounded-3xl border border-lime/40 bg-lime/[0.07] p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime">
          <Gift className="h-4 w-4 text-paper" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">
            Sizga handle taklif qilingan
          </h2>
          <p className="mt-1 text-sm text-paper-2">
            Qabul qilsangiz, u sizniki bo&apos;ladi va kabinetingizda paydo bo&apos;ladi.
          </p>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {transfers.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-line bg-ink-s1 px-5 py-4"
          >
            <span className="font-display text-lg font-semibold tracking-tight">
              {t.handle}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await acceptHandleTransfer(t.id);
                  setError(result.ok ? null : (result.error ?? "Qabul qilinmadi."));
                })
              }
              className="rounded-full bg-ink-s2 px-6 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/90 disabled:bg-black/20"
            >
              {pending ? "Qabul qilinmoqda…" : "Qabul qilish"}
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-sm text-danger-ink">{error}</p>}
    </section>
  );
}
