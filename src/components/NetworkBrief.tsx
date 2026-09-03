"use client";

import { useActionState, useState } from "react";
import { Check, ChevronDown, Copy, Send, Shield, Sparkles, Trash2 } from "lucide-react";

import {
  buildBrief,
  dropBrief,
  type NetworkState,
} from "@/app/kabinet/[handle]/tarmoq/actions";
import { timeAgo } from "@/lib/relative-time";

// The assistant, on its own ground.
//
// Drawn on ink rather than as one more white card, because it is a different
// kind of thing from the list underneath it: the list is fact, this is an
// opinion, and a reader should be able to tell them apart without reading
// either. The lime is spent here and almost nowhere else on the screen.
//
// The drafts are the working part. A message the assistant writes and nobody
// can use is a demonstration; each one carries a copy button and, where there
// is a number, a way to open it in Telegram — the two ends of the only journey
// this panel exists to shorten.

export type BriefView = {
  summary: string;
  suggestions: {
    why: string;
    draft: string;
    name: string;
    contactId: number;
    phone: string | null;
  }[];
  contactsSeen: number;
  builtAt: string;
};

function DraftActions({ draft, phone }: { draft: string; phone: string | null }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(draft);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            // A denied clipboard is not worth a dialogue: the text is on
            // screen and can be selected.
          }
        }}
        className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white/80 transition-colors hover:bg-white/15"
      >
        {copied ? <Check className="h-3 w-3 text-lime" /> : <Copy className="h-3 w-3" />}
        {copied ? "Nusxa olindi" : "Nusxa olish"}
      </button>

      {phone && (
        <a
          href={`https://t.me/+${phone.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white/80 transition-colors hover:bg-white/15"
        >
          <Send className="h-3 w-3" />
          Telegram
        </a>
      )}
    </div>
  );
}

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
  const [showTerms, setShowTerms] = useState(false);

  const stale = brief ? brief.contactsSeen !== contactCount : false;
  const enough = contactCount >= 4;

  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-flex-black text-white">
      <div className="flex items-center gap-3 px-6 pt-6 sm:px-7">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime">
          <Sparkles className="h-3.5 w-3.5 text-flex-black" />
        </span>
        <h2 className="font-display text-[15px] font-semibold tracking-tight">
          Yordamchi
        </h2>
        {brief && (
          <span className="ml-auto font-tabular text-[11px] text-white/35">
            {timeAgo(brief.builtAt, "uz")}
            {stale && " · ro'yxat o'zgargan"}
          </span>
        )}
      </div>

      {brief ? (
        <>
          <p className="px-6 pt-4 text-[15px] leading-relaxed text-white/85 sm:px-7">
            {brief.summary}
          </p>

          {brief.suggestions.length > 0 && (
            <ul className="mt-5 space-y-px bg-white/8">
              {brief.suggestions.map((s, i) => (
                <li key={s.contactId} className="bg-flex-black px-6 py-5 sm:px-7">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-tabular text-[11px] text-lime">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[15px] font-semibold tracking-tight">{s.name}</p>
                  </div>
                  <p className="mt-1.5 pl-[26px] text-[13px] leading-relaxed text-white/50">
                    {s.why}
                  </p>
                  <div className="mt-3 pl-[26px]">
                    <p className="rounded-xl bg-white/[0.06] p-3.5 text-[13px] leading-relaxed text-white/90">
                      {s.draft}
                    </p>
                    <DraftActions draft={s.draft} phone={s.phone} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2 px-6 py-5 sm:px-7">
            <form action={action}>
              <input type="hidden" name="handle" value={handle} />
              <button
                type="submit"
                disabled={working}
                className="rounded-xl bg-white/10 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-40"
              >
                {working ? "O'qiyapti…" : "Yangilash"}
              </button>
            </form>
            <form action={dropBrief}>
              <input type="hidden" name="handle" value={handle} />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] text-white/35 transition-colors hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                O&apos;chirish
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="px-6 pb-6 pt-3 sm:px-7">
          <p className="text-[15px] leading-relaxed text-white/60">
            {enough
              ? "Ro'yxatni o'qib, bugun kimga javob berish kerakligini va nima yozishni aytadi."
              : `Kamida to'rtta kontakt kerak. Hozir ${contactCount} ta.`}
          </p>

          {/* Folded, but never further than one tap away, and never after the
              button. What is sent is the owner's decision to make and they
              cannot make it from a wall of grey text they scrolled past. */}
          <button
            type="button"
            onClick={() => setShowTerms((was) => !was)}
            className="mt-4 flex items-center gap-1.5 text-[12px] text-white/45 transition-colors hover:text-white/70"
          >
            <Shield className="h-3.5 w-3.5" />
            Nima yuboriladi
            <ChevronDown
              className={showTerms ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"}
            />
          </button>

          {showTerms && (
            <p className="mt-3 rounded-xl bg-white/[0.06] p-4 text-[13px] leading-relaxed text-white/60">
              Ism, telefon va email <strong className="text-white/90">yuborilmaydi</strong>.
              Faqat kompaniya, bosqich, kunlar soni va izohlar ketadi; har bir odam
              K1, K2 kabi belgi bilan boradi va ismni faqat siz ko&apos;rasiz.
              Izohlar o&apos;zgartirilmay yuboriladi — ularda boshqa odamning ismi
              bo&apos;lsa, u ham ketadi.
            </p>
          )}

          <form action={action} className="mt-5">
            <input type="hidden" name="handle" value={handle} />
            <button
              type="submit"
              disabled={working || !enough}
              className="w-full rounded-2xl bg-lime px-6 py-3.5 text-[14px] font-semibold text-flex-black transition-transform hover:scale-[1.01] disabled:opacity-25 sm:w-auto sm:px-8"
            >
              {working ? "O'qiyapti…" : "Tahlil qilish"}
            </button>
          </form>
        </div>
      )}

      {state.error && (
        <p className="mx-6 mb-6 rounded-xl bg-red-500/15 p-3.5 text-[13px] text-red-200 sm:mx-7">
          {state.error}
        </p>
      )}
    </section>
  );
}
