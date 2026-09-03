"use client";

import { useActionState } from "react";
import { Sparkles, Trash2 } from "lucide-react";

import {
  buildBrief,
  dropBrief,
  type NetworkState,
} from "@/app/kabinet/[handle]/tarmoq/actions";
import { timeAgo } from "@/lib/relative-time";

// The assistant's note above the list.
//
// It sits above a list that is already correct without it, and is allowed to be
// absent — no key, a busy vendor, fewer than four contacts. What it must never
// be is a surprise: the panel says what leaves before anything does, because
// the substance being sent is other people's notes and the owner is the only
// person who can weigh that.

export type BriefView = {
  summary: string;
  suggestions: { why: string; draft: string; name: string; contactId: number }[];
  contactsSeen: number;
  builtAt: string;
};

export default function NetworkBrief({
  handle,
  brief,
  contactCount,
}: {
  handle: string;
  brief: BriefView | null;
  contactCount: number;
}) {
  const [state, action, working] = useActionState<NetworkState, FormData>(
    buildBrief,
    {},
  );

  const stale = brief ? brief.contactsSeen !== contactCount : false;

  return (
    <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime">
          <Sparkles className="h-4 w-4 text-flex-black" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold">Yordamchi</h2>
          <p className="mt-1 text-sm leading-relaxed text-flex-black/55">
            Ro&apos;yxatni o&apos;qib, bugun kimga javob berish kerakligini
            aytadi.
          </p>
        </div>
      </div>

      {brief ? (
        <>
          <p className="mt-6 text-sm leading-relaxed">{brief.summary}</p>

          {brief.suggestions.length > 0 && (
            <ul className="mt-5 space-y-3">
              {brief.suggestions.map((s) => (
                <li
                  key={s.contactId}
                  className="rounded-2xl border border-black/8 bg-black/[0.02] p-4"
                >
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="mt-1 text-sm text-flex-black/60">{s.why}</p>
                  {/* Shown as something to copy rather than something to send:
                      nothing here has the right to message anybody. */}
                  <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-relaxed text-flex-black/80">
                    {s.draft}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-xs text-flex-black/45">
              {timeAgo(brief.builtAt, "uz")}
              {stale && " · ro'yxat o'zgargan"}
            </span>
            <form action={action} className="contents">
              <input type="hidden" name="handle" value={handle} />
              <button
                type="submit"
                disabled={working}
                className="rounded-xl border border-black/12 px-4 py-2 text-sm text-flex-black/70 transition-colors hover:border-black/30 disabled:opacity-50"
              >
                {working ? "O'qiyapti…" : "Yangilash"}
              </button>
            </form>
            <form action={dropBrief}>
              <input type="hidden" name="handle" value={handle} />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-flex-black/45 transition-colors hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                O&apos;chirish
              </button>
            </form>
          </div>
        </>
      ) : (
        <form action={action} className="mt-6">
          <input type="hidden" name="handle" value={handle} />
          {/* Said before the button, not after it. */}
          <p className="rounded-2xl bg-black/[0.03] p-4 text-sm leading-relaxed text-flex-black/60">
            Tahlil uchun ism, telefon va email <strong>yuborilmaydi</strong> —
            faqat kompaniya, bosqich, kunlar soni va izohlaringiz ketadi. Har
            bir odam K1, K2 kabi belgi bilan boradi va ismni faqat siz
            ko&apos;rasiz. Izohlar o&apos;zgartirilmay yuboriladi, shuning uchun
            unda boshqa odamning ismi bo&apos;lsa, u ham ketadi.
          </p>
          <button
            type="submit"
            disabled={working || contactCount < 4}
            className="mt-4 w-full rounded-2xl bg-flex-black px-6 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] disabled:opacity-40 sm:w-auto"
          >
            {working ? "O'qiyapti…" : "Tahlil qilish"}
          </button>
          {contactCount < 4 && (
            <p className="mt-3 text-sm text-flex-black/45">
              Kamida to&apos;rtta kontakt kerak — hozir {contactCount} ta.
            </p>
          )}
        </form>
      )}

      {state.error && <p className="mt-4 text-sm text-red-700">{state.error}</p>}
    </section>
  );
}
