"use client";

import { useActionState } from "react";
import { requestVenueQuote, type VenueFormState } from "@/app/biznes/actions";
import { COMPANY } from "@/lib/company";
import type { B2BDict } from "@/lib/i18n";
import { VERTICALS, TYPICAL_POINTS } from "@/lib/venues";

const field =
  "w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-lime/50";
const label = "mb-1.5 block text-xs font-medium tracking-wide text-white/45 uppercase";

export default function VenueRequestForm({ t }: { t: B2BDict }) {
  const [state, action, sending] = useActionState<VenueFormState, FormData>(
    requestVenueQuote,
    { ok: true },
  );

  if (state.sent) {
    return (
      <div className="rounded-3xl border border-lime/40 bg-lime/[0.08] p-8">
        <h3 className="font-display text-lg font-semibold text-white">{t.sentTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          {t.sentBody}{" "}
          <a href={`tel:${COMPANY.phoneHref}`} className="text-lime hover:underline">
            {COMPANY.phone}
          </a>
        </p>
      </div>
    );
  }

  // A lead form must never dead-end: when the row cannot be written the person
  // is handed the phone number rather than an apology.
  const message = state.code ? t.errors[state.code] : null;

  return (
    <form action={action} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vertical" className={label}>
            {t.fields.vertical}
          </label>
          <select id="vertical" name="vertical" defaultValue="cafe" className={field}>
            {VERTICALS.map((id) => (
              <option key={id} value={id} className="bg-flex-black">
                {t.verticals[id].name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="points" className={label}>
            {t.fields.points}
          </label>
          <input
            id="points"
            name="points"
            type="number"
            min={1}
            required
            defaultValue={TYPICAL_POINTS.cafe}
            className={field}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="company" className={label}>
            {t.fields.company}
          </label>
          <input
            id="company"
            name="company"
            required
            className={field}
            placeholder={t.fields.companyHint}
          />
        </div>
        <div>
          <label htmlFor="contactName" className={label}>
            {t.fields.contactName}
          </label>
          <input id="contactName" name="contactName" required className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>
            {t.fields.phone}
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
            {t.fields.email}
          </label>
          <input id="email" name="email" type="email" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="note" className={label}>
            {t.fields.note}
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            className={field}
            placeholder={t.fields.noteHint}
          />
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-red-300">
          {message}{" "}
          {state.fallback && (
            <a href={`tel:${COMPANY.phoneHref}`} className="text-lime hover:underline">
              {COMPANY.phone}
            </a>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full rounded-full bg-lime px-6 py-4 font-medium text-flex-black transition-transform hover:scale-[1.005] disabled:opacity-60"
      >
        {sending ? t.sending : t.submit}
      </button>
    </form>
  );
}
