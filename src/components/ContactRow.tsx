"use client";

import { useState } from "react";
import { CalendarDays, Mail, Phone, Send } from "lucide-react";

import { moveStage, saveContactNote } from "@/app/kabinet/[handle]/tarmoq/actions";
import { STAGES, reasonLabel, stageLabel, type Contact, type Reason } from "@/lib/crm";
import { ReasonIcon, StageIcon } from "@/components/CrmIcon";

// One person in the list.
//
// Collapsed: who, where they work, and — on the left edge — a stripe whose
// colour is the only thing that has to be read from arm's length. Somebody
// scanning this list is looking for the red one.
//
// Opened: the two things that move a relationship, a note and a date, plus the
// ways to reach them. Not a form of fifteen fields; those get filled in once
// and never read.

const STRIPE: Record<Exclude<Reason, null>, string> = {
  overdue: "bg-red-500",
  today: "bg-lime",
  unanswered: "bg-amber-400",
  quiet: "bg-black/15",
};

const CHIP: Record<Exclude<Reason, null>, string> = {
  overdue: "bg-red-50 text-red-700",
  today: "bg-lime text-flex-black",
  unanswered: "bg-amber-50 text-amber-800",
  quiet: "bg-black/[0.05] text-flex-black/50",
};

/** Two letters, because a photo is not something a tap ever collects. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function ContactRow({
  handle,
  contact,
  reason,
  delayMs = 0,
}: {
  handle: string;
  contact: Contact;
  reason: Reason;
  /** Where this row sits in the deal, so the list arrives rather than appears. */
  delayMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const label = reasonLabel(reason, "uz");
  const telegram = contact.phone
    ? `https://t.me/+${contact.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <li
      className="rise relative overflow-hidden rounded-2xl border border-black/6 bg-white transition-shadow duration-300 hover:shadow-[0_6px_20px_-8px_rgba(14,10,27,0.18)]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {reason && (
        <span className={`absolute inset-y-0 left-0 w-[3px] ${STRIPE[reason]}`} />
      )}

      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        className="flex w-full items-center gap-3.5 py-3.5 pl-5 pr-4 text-left"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flex-black font-display text-[12px] font-semibold tracking-tight text-white">
          {initials(contact.name)}
          {/* The stage, on the corner of the face, so the list can be read
              without opening anything. */}
          <span className="absolute -right-1 -bottom-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white ring-2 ring-white">
            <StageIcon stage={contact.stage} className="h-3 w-3 text-flex-black/55" />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-tight">
            {contact.name}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-flex-black/45">
            {[contact.company, contact.ownerNote ?? contact.note]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {label ? (
          <span
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${CHIP[reason as Exclude<Reason, null>]}`}
          >
            <ReasonIcon reason={reason as Exclude<Reason, null>} className="h-3 w-3" />
            {label}
          </span>
        ) : (
          <span className="shrink-0 text-[11px] text-flex-black/30">
            {stageLabel(contact.stage, "uz")}
          </span>
        )}
      </button>

      {open && (
        <div className="rise border-t border-black/6 px-5 pb-5 pt-4">
          <div className="flex flex-wrap gap-2">
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-1.5 rounded-xl bg-black/[0.04] px-3 py-2 text-[12px] font-medium transition-colors hover:bg-black/[0.07]"
              >
                <Phone className="h-3.5 w-3.5" />
                {contact.phone}
              </a>
            )}
            {telegram && (
              <a
                href={telegram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-black/[0.04] px-3 py-2 text-[12px] font-medium transition-colors hover:bg-black/[0.07]"
              >
                <Send className="h-3.5 w-3.5" />
                Telegram
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 rounded-xl bg-black/[0.04] px-3 py-2 text-[12px] font-medium transition-colors hover:bg-black/[0.07]"
              >
                <Mail className="h-3.5 w-3.5" />
                {contact.email}
              </a>
            )}
          </div>

          {/* What they said about themselves, which is usually the only thing
              that explains why the meeting happened. Kept apart, and kept
              theirs. */}
          {contact.note && (
            <p className="mt-4 border-l-2 border-black/8 pl-3 text-[13px] leading-relaxed text-flex-black/55">
              {contact.note}
            </p>
          )}

          <div className="mt-4 inline-flex rounded-xl bg-black/[0.04] p-1">
            {STAGES.map((stage) => (
              <form action={moveStage} key={stage}>
                <input type="hidden" name="handle" value={handle} />
                <input type="hidden" name="contactId" value={contact.id} />
                <input type="hidden" name="stage" value={stage} />
                <button
                  type="submit"
                  className={
                    stage === contact.stage
                      ? "flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold shadow-[0_1px_3px_rgba(14,10,27,0.12)]"
                      : "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-flex-black/45 transition-colors hover:text-flex-black/70"
                  }
                >
                  <StageIcon stage={stage} className="h-3 w-3" />
                  {stageLabel(stage, "uz")}
                </button>
              </form>
            ))}
          </div>

          <form action={saveContactNote} className="mt-4">
            <input type="hidden" name="handle" value={handle} />
            <input type="hidden" name="contactId" value={contact.id} />
            <textarea
              name="ownerNote"
              rows={2}
              defaultValue={contact.ownerNote ?? ""}
              placeholder="Nima kelishildi"
              className="w-full resize-none rounded-xl bg-black/[0.03] px-3.5 py-3 text-[13px] outline-none placeholder:text-flex-black/25 focus:bg-black/[0.05]"
            />
            <div className="mt-2 flex items-center gap-2">
              <label
                htmlFor={`due-${contact.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-black/[0.03] px-3 py-2 text-[12px] text-flex-black/45"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <input
                  id={`due-${contact.id}`}
                  type="date"
                  name="followUpOn"
                  defaultValue={contact.followUpOn ?? ""}
                  className="bg-transparent text-[12px] text-flex-black outline-none"
                />
              </label>
              <button
                type="submit"
                className="ml-auto rounded-xl bg-flex-black px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:scale-[1.02]"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}
    </li>
  );
}
