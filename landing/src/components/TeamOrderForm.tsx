"use client";

import { useActionState } from "react";
import { requestTeamOrder, type TeamFormState } from "@/app/biznes/actions";
import { COMPANY } from "@/lib/company";

const field =
  "w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-lime/50";
const label = "mb-1.5 block text-xs font-medium tracking-wide text-white/45 uppercase";

export default function TeamOrderForm() {
  const [state, action, sending] = useActionState<TeamFormState, FormData>(requestTeamOrder, {
    ok: true,
  });

  if (state.sent) {
    return (
      <div className="rounded-3xl border border-lime/40 bg-lime/[0.08] p-8">
        <h3 className="font-display text-lg font-semibold text-white">Qabul qilindi</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          Bir ish kuni ichida bog&apos;lanamiz. Shoshilinch bo&apos;lsa{" "}
          <a href={`tel:${COMPANY.phoneHref}`} className="text-lime hover:underline">
            {COMPANY.phone}
          </a>{" "}
          ga qo&apos;ng&apos;iroq qiling.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className={label}>
            Kompaniya
          </label>
          <input id="company" name="company" required className={field} placeholder="MCHJ nomi" />
        </div>
        <div>
          <label htmlFor="teamSize" className={label}>
            Nechta xodim
          </label>
          <input
            id="teamSize"
            name="teamSize"
            type="number"
            min={1}
            required
            className={field}
            placeholder="20"
          />
        </div>
        <div>
          <label htmlFor="contactName" className={label}>
            Ismingiz
          </label>
          <input id="contactName" name="contactName" required className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className={field}
            placeholder="+998 90 123 45 67"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="email" className={label}>
            Elektron pochta <span className="normal-case">&mdash; ixtiyoriy</span>
          </label>
          <input id="email" name="email" type="email" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="note" className={label}>
            Izoh <span className="normal-case">&mdash; ixtiyoriy</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={1000}
            className={`${field} resize-none`}
            placeholder="Qanday qurilma, qanday brend, qachonga kerak"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="mt-6 rounded-full bg-lime px-7 py-3 font-medium text-flex-black transition-transform hover:scale-[1.02] disabled:bg-white/20 disabled:text-white/40"
      >
        {sending ? "Yuborilmoqda…" : "Hisob-kitob so'rash"}
      </button>

      {state.error && (
        <p className="mt-3 text-sm text-red-300">
          {state.error}
          {state.fallback && (
            <>
              {" "}
              <a href={`tel:${COMPANY.phoneHref}`} className="text-lime hover:underline">
                {COMPANY.phone}
              </a>{" "}
              ga qo&apos;ng&apos;iroq qiling &mdash; buyurtmangiz yo&apos;qolmasin.
            </>
          )}
        </p>
      )}
    </form>
  );
}
