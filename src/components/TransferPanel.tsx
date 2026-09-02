"use client";

import { useActionState, useTransition } from "react";
import { ArrowRightLeft } from "lucide-react";
import {
  offerHandleTransfer,
  cancelHandleTransfer,
  type TransferActionResult,
} from "@/app/kabinet/[handle]/actions";
import { formatDate } from "@/lib/format";
import type { Transfer } from "@/lib/transfers";

const STATUS_LABEL: Record<Transfer["status"], string> = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilindi",
  cancelled: "Bekor qilindi",
  expired: "Muddati o'tdi",
};

export default function TransferPanel({
  handle,
  transfers,
}: {
  handle: string;
  transfers: Transfer[];
}) {
  const [state, action, sending] = useActionState<TransferActionResult, FormData>(
    offerHandleTransfer.bind(null, handle),
    { ok: true }
  );
  const [cancelling, startCancel] = useTransition();

  const live = transfers.find((t) => t.status === "pending");
  const past = transfers.filter((t) => t.status !== "pending");

  return (
    <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.06]">
          <ArrowRightLeft className="h-4 w-4 text-flex-black/70" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Boshqa odamga o&apos;tkazish</h2>
          <p className="mt-1 text-sm leading-relaxed text-flex-black/55">
            {handle} sizniki &mdash; xohlagan vaqtingizda boshqasiga berasiz yoki sotasiz.
            Manzilni kiriting, u qabul qilgach handle unga o&apos;tadi.
          </p>
        </div>
      </div>

      {live ? (
        <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-5">
          <p className="text-sm text-flex-black/70">
            <span className="font-medium">{live.toEmail}</span> ga taklif yuborilgan.
          </p>
          <p className="mt-1 text-xs text-flex-black/45">
            {formatDate(live.expiresAt)} gacha kutadi. Shu vaqtgacha qabul qilinmasa,
            taklif o&apos;z-o&apos;zidan yopiladi.
          </p>
          <button
            type="button"
            disabled={cancelling}
            onClick={() => startCancel(() => void cancelHandleTransfer(live.id))}
            className="mt-4 rounded-full border border-black/15 px-5 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] disabled:opacity-50"
          >
            {cancelling ? "Bekor qilinmoqda…" : "Taklifni bekor qilish"}
          </button>
        </div>
      ) : (
        <form action={action} className="mt-6 flex flex-wrap items-start gap-3">
          <label htmlFor="transfer-email" className="sr-only">
            Qabul qiluvchining elektron pochtasi
          </label>
          <input
            id="transfer-email"
            name="email"
            type="email"
            required
            placeholder="xaridor@example.com"
            className="min-w-0 flex-1 rounded-full border border-black/12 px-5 py-2.5 text-sm outline-none placeholder:text-flex-black/30 focus:border-flex-black/40"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-flex-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-flex-black/85 disabled:bg-black/20"
          >
            {sending ? "Yuborilmoqda…" : "Taklif yuborish"}
          </button>
        </form>
      )}

      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

      <p className="mt-4 text-xs leading-relaxed text-flex-black/40">
        Handle o&apos;tgach profilingiz tozalanadi: ism, bio, havolalar, postlar va
        obunachilar yangi egaga o&apos;tmaydi. Raqamning o&apos;zi va tashriflar tarixi qoladi.
      </p>

      {past.length > 0 && (
        <ul className="mt-6 space-y-2 border-t border-black/5 pt-5">
          {past.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 text-xs">
              <span className="truncate text-flex-black/50">{t.toEmail}</span>
              <span className="shrink-0 text-flex-black/35">
                {STATUS_LABEL[t.status]} &middot; {formatDate(t.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
