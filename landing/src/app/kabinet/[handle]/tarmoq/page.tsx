import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Contact2, UsersRound, Zap } from "lucide-react";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import NetworkBrief, { type BriefView } from "@/components/NetworkBrief";
import ContactRow from "@/components/ContactRow";
import AddContactForm from "@/components/AddContactForm";
import { StageIcon } from "@/components/CrmIcon";
import { requireOwnHandle } from "@/lib/kabinet";
import { getBrief, listContacts } from "@/lib/contacts";
import {
  byAttention,

  reasonFor,
  shapeOf,
  stageLabel,
  waitingCount,
} from "@/lib/crm";

export const metadata: Metadata = {
  title: "Tarmoq — flex.com.uz",
  robots: { index: false },
};

// The briefing action on this page waits on a model that has taken over two
// minutes when the fast ones are busy. The page itself renders instantly — the
// briefing is read from storage — but the action that writes one needs the
// room, and the platform default would kill it partway.
export const maxDuration = 300;

// Everyone this number has met, in the order they need answering.
//
// The ordering is crm.ts's and is the whole screen: a contact list sorted by
// date is one somebody scrolls once, because the person who most needs an
// answer is rarely the newest.
//
// The filter is in the address rather than in component state, like the
// cabinet's own tabs: the page stays server-rendered, and "the four people
// waiting on me" is a view somebody sends themselves.

const FILTERS = ["kutmoqda", "new", "talking", "client", "cold"] as const;

export default async function NetworkPage({
  params,
  searchParams,
}: PageProps<"/kabinet/[handle]/tarmoq">) {
  const { handle } = await params;
  const { holat } = await searchParams;
  const { normalized, userId } = await requireOwnHandle(
    handle,
    "/kabinet/[handle]/tarmoq",
  );

  const contacts = await listContacts(normalized, userId);
  const stored = await getBrief(normalized, userId);
  const today = new Date();

  const filter = typeof holat === "string" && (FILTERS as readonly string[]).includes(holat)
    ? holat
    : null;

  const ordered = byAttention(contacts, today);
  const shown = !filter
    ? ordered
    : filter === "kutmoqda"
      ? ordered.filter((c) => reasonFor(c, today) !== null)
      : ordered.filter((c) => c.stage === filter);

  const waiting = waitingCount(contacts, today);
  const shape = shapeOf(contacts);

  // The briefing was written against references the model never saw resolved.
  // Names and numbers are attached here, on our own server, from our own rows.
  const byId = new Map(contacts.map((c) => [c.id, c]));
  const brief: BriefView | null = stored
    ? {
        summary: stored.summary,
        contactsSeen: stored.contactsSeen,
        builtAt: stored.builtAt,
        suggestions: stored.suggestions
          .map((s) => {
            const contact = byId.get(s.contactId);
            return contact
              ? {
                  why: s.why,
                  draft: s.draft,
                  name: contact.name,
                  contactId: contact.id,
                  phone: contact.phone,
                }
              : null;
          })
          .filter((s): s is NonNullable<typeof s> => s !== null),
      }
    : null;

  const at = (value: string | null) =>
    value
      ? `/kabinet/${normalized}/tarmoq?holat=${value}`
      : `/kabinet/${normalized}/tarmoq`;

  const pill = (active: boolean) =>
    active
      ? "flex shrink-0 items-center gap-1.5 rounded-xl bg-flex-black px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_4px_14px_-6px_rgba(14,10,27,0.6)]"
      : "flex shrink-0 items-center gap-1.5 rounded-xl bg-black/[0.04] px-3.5 py-2 text-[12px] font-medium text-flex-black/55 transition-all hover:bg-black/[0.07] hover:text-flex-black";

  return (
    <PageShell wide>
      <SubScreen handle={normalized} title="Tarmoq">
        {/* Side by side once there is room. The list is what somebody works
            through and the assistant is what they consult while working, so on
            a laptop the assistant stops pushing the list down the page and
            stays beside it instead. */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
          <div className="lg:order-2 lg:sticky lg:top-8 lg:space-y-5">
        {/* The number that decides what the morning looks like, at the size
            that decision deserves — and on the brand's own ground rather than
            on white, because a card that is white on white is a page and this
            is meant to be an application. */}
        <section className="grain relative overflow-hidden rounded-[1.75rem] bg-flex-black p-6 text-white sm:p-7">
          <div className="bg-dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_100%_0%,black,transparent)]" />
          <div className="card-sheen absolute inset-0" />

          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-white/40 uppercase">
              <UsersRound className="h-3.5 w-3.5" />
              Javob kutmoqda
            </div>

            <div className="mt-2 flex items-end gap-3">
              <p className="font-display text-[52px] leading-[0.9] font-semibold tracking-tight text-lime">
                {waiting}
              </p>
              {waiting > 0 && (
                <span className="halo mb-2 h-2 w-2 rounded-full bg-lime" aria-hidden />
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/45">
              <span className="flex items-center gap-1.5">
                <Contact2 className="h-3.5 w-3.5" />
                <span className="font-tabular text-white">{shape.total}</span> ta
                kontakt
              </span>
              {shape.companies.slice(0, 2).map((firm) => (
                <span key={firm.name} className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {firm.name}{" "}
                  <span className="font-tabular text-white">{firm.count}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

            <div className="hidden lg:block">
              <NetworkBrief
                handle={normalized}
                brief={brief}
                contactCount={contacts.length}
              />
            </div>
          </div>

          <div className="lg:order-1">
        <div className="lg:hidden">
          <NetworkBrief
            handle={normalized}
            brief={brief}
            contactCount={contacts.length}
          />
        </div>

        {contacts.length > 0 && (
          <div className="mt-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <Link href={at(null)} className={pill(filter === null)}>
              Hammasi
            </Link>
            <Link href={at("kutmoqda")} className={pill(filter === "kutmoqda")}>
              <Zap className="h-3.5 w-3.5" />
              Kutmoqda {waiting > 0 && <span className="font-tabular">{waiting}</span>}
            </Link>
            {(["new", "talking", "client", "cold"] as const).map((stage) => {
              const count = shape.byStage[stage];
              if (count === 0) return null;
              return (
                <Link key={stage} href={at(stage)} className={pill(filter === stage)}>
                  <StageIcon stage={stage} className="h-3.5 w-3.5" />
                  {stageLabel(stage, "uz")}{" "}
                  <span className="font-tabular">{count}</span>
                </Link>
              );
            })}
          </div>
        )}

        {contacts.length === 0 ? (
          <section className="mt-6 rounded-[1.75rem] border border-black/6 bg-white p-10 text-center">
            <p className="font-display text-[17px] font-semibold tracking-tight">
              Hali hech kim kontakt qoldirmagan
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-flex-black/50">
              Kartangizni tegizgan odam o&apos;z ismini va raqamini shu yerga
              yuboradi. Qog&apos;ozda olingan raqamlarni esa o&apos;zingiz
              qo&apos;shasiz.
            </p>
            <div className="mt-5 flex justify-center">
              <AddContactForm handle={normalized} />
            </div>
          </section>
        ) : (
          <>
            <ul className="mt-4 space-y-2">
              {shown.map((contact, i) => (
                <ContactRow
                  key={contact.id}
                  handle={normalized}
                  contact={contact}
                  reason={reasonFor(contact, today)}
                  // Capped: past the eighth row nobody is watching the
                  // animation, they are waiting for it.
                  delayMs={Math.min(i, 8) * 45}
                />
              ))}
            </ul>

            {shown.length === 0 && (
              <p className="mt-4 rounded-2xl border border-dashed border-black/12 p-8 text-center text-[13px] text-flex-black/45">
                Bu bo&apos;limda hech kim yo&apos;q.
              </p>
            )}

            {/* After the list, not before it: the list is meant to fill itself
                and a form above it suggests otherwise. */}
            <div className="mt-5">
              <AddContactForm handle={normalized} />
            </div>
          </>
        )}
          </div>
        </div>
      </SubScreen>
    </PageShell>
  );
}
