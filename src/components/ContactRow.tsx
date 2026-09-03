"use client";

import { useState } from "react";
import { Mail, Phone } from "lucide-react";

import { moveStage, saveContactNote } from "@/app/kabinet/[handle]/tarmoq/actions";
import { STAGES, reasonLabel, stageLabel, type Contact, type Reason } from "@/lib/crm";

// One person in the list.
//
// Collapsed it is a name, a firm and why they are near the top. Opened it is
// the two things that actually move a relationship: a note and a date to come
// back on. Everything else a CRM usually offers is a field somebody fills in
// once and never reads.

const REASON_STYLE: Record<Exclude<Reason, null>, string> = {
  overdue: "bg-red-600 text-white",
  today: "bg-lime text-flex-black",
  unanswered: "bg-amber-100 text-amber-900",
  quiet: "bg-black/[0.06] text-flex-black/60",
};

export default function ContactRow({
  handle,
  contact,
  reason,
}: {
  handle: string;
  contact: Contact;
  reason: Reason;
}) {
  const [open, setOpen] = useState(false);
  const label = reasonLabel(reason, "uz");

  return (
    <li className="rounded-2xl border border-black/8 bg-white">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {contact.name}
            {contact.company && (
              <span className="ml-2 font-normal text-flex-black/45">
                {contact.company}
              </span>
            )}
          </p>
          {/* What they said about themselves, which is usually the only thing
              that explains why the meeting happened. */}
          {contact.note && (
            <p className="mt-1 line-clamp-1 text-sm text-flex-black/55">{contact.note}</p>
          )}
          {contact.ownerNote && (
            <p className="mt-1 line-clamp-1 text-sm text-flex-black/45">
              {contact.ownerNote}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {label && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${REASON_STYLE[reason as Exclude<Reason, null>]}`}
            >
              {label}
            </span>
          )}
          <span className="text-xs text-flex-black/40">
            {stageLabel(contact.stage, "uz")}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-black/8 p-4">
          <div className="flex flex-wrap gap-2">
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-1.5 rounded-xl border border-black/12 px-3 py-2 text-sm"
              >
                <Phone className="h-3.5 w-3.5" />
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 rounded-xl border border-black/12 px-3 py-2 text-sm"
              >
                <Mail className="h-3.5 w-3.5" />
                {contact.email}
              </a>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {STAGES.map((stage) => (
              <form action={moveStage} key={stage}>
                <input type="hidden" name="handle" value={handle} />
                <input type="hidden" name="contactId" value={contact.id} />
                <input type="hidden" name="stage" value={stage} />
                <button
                  type="submit"
                  disabled={stage === contact.stage}
                  className={
                    stage === contact.stage
                      ? "rounded-xl bg-flex-black px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-xl border border-black/12 px-3 py-1.5 text-xs text-flex-black/60 transition-colors hover:border-black/30"
                  }
                >
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
              className="w-full resize-none rounded-2xl border border-black/12 px-4 py-3 text-sm outline-none placeholder:text-flex-black/30 focus:border-flex-black/40"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-xs text-flex-black/45" htmlFor={`due-${contact.id}`}>
                Qachon qaytish
              </label>
              <input
                id={`due-${contact.id}`}
                type="date"
                name="followUpOn"
                defaultValue={contact.followUpOn ?? ""}
                className="rounded-xl border border-black/12 px-3 py-2 text-sm outline-none focus:border-flex-black/40"
              />
              <button
                type="submit"
                className="ml-auto rounded-xl bg-flex-black px-4 py-2 text-sm font-medium text-white"
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
