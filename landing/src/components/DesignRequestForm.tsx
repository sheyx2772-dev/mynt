"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { submitDesignRequest, type DesignRequestResult } from "@/app/kabinet/[handle]/actions";
import type { DesignRequest } from "@/lib/design-requests";

const STATUS_LABEL: Record<DesignRequest["status"], string> = {
  pending: "Navbatda",
  filled: "Tayyor",
  refused: "Rad etildi",
};

const STATUS_STYLE: Record<DesignRequest["status"], string> = {
  pending: "bg-black/[0.06] text-flex-black/60",
  filled: "bg-lime text-flex-black",
  refused: "bg-red-50 text-red-700",
};

export default function DesignRequestForm({
  handle,
  requests,
}: {
  handle: string;
  requests: DesignRequest[];
}) {
  const [state, action, pending] = useActionState<DesignRequestResult, FormData>(
    submitDesignRequest.bind(null, handle),
    { ok: true }
  );

  const inQueue = requests.some((r) => r.status === "pending");

  return (
    <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime">
          <Sparkles className="h-4 w-4 text-flex-black" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">O&apos;zingizga dizayn</h2>
          <p className="mt-1 text-sm leading-relaxed text-flex-black/55">
            Qanday karta xohlayotganingizni o&apos;z so&apos;zingiz bilan yozing. Kasbingiz,
            qiziqishingiz, yoqtirgan rangingiz &mdash; qanday bo&apos;lsa shunday.
          </p>
        </div>
      </div>

      <form action={action} className="mt-6">
        <label htmlFor="wish" className="sr-only">
          Dizayn tavsifi
        </label>
        <textarea
          id="wish"
          name="wish"
          rows={3}
          maxLength={400}
          required
          disabled={inQueue || pending}
          placeholder="Masalan: qora fonda oltin naqsh, jiddiy va sodda"
          className="w-full resize-none rounded-2xl border border-black/12 px-4 py-3 text-sm outline-none placeholder:text-flex-black/30 focus:border-flex-black/40 disabled:bg-black/[0.03] disabled:text-flex-black/40"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={inQueue || pending}
            className="rounded-full bg-flex-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-flex-black/85 disabled:bg-black/20"
          >
            {pending ? "Yuborilmoqda…" : "So'rov yuborish"}
          </button>
          {inQueue && (
            <p className="text-xs text-flex-black/45">
              So&apos;rovingiz navbatda. Tayyor bo&apos;lgach yana so&apos;rashingiz mumkin.
            </p>
          )}
        </div>

        {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
        {state.queued && (
          <p className="mt-3 text-sm text-flex-black/60">
            Qabul qilindi. Tayyor bo&apos;lganda shu yerda ko&apos;rinadi.
          </p>
        )}
      </form>

      {requests.length > 0 && (
        <ul className="mt-7 space-y-3 border-t border-black/5 pt-6">
          {requests.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm text-flex-black/70">{r.wish}</p>
                {r.note && <p className="mt-0.5 text-xs text-flex-black/45">{r.note}</p>}
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}
              >
                {STATUS_LABEL[r.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
