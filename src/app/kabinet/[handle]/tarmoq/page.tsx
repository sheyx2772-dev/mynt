import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import NetworkBrief, { type BriefView } from "@/components/NetworkBrief";
import ContactRow from "@/components/ContactRow";
import AddContactForm from "@/components/AddContactForm";
import { requireOwnHandle } from "@/lib/kabinet";
import { getBrief, listContacts } from "@/lib/contacts";
import { byAttention, reasonFor, shapeOf, waitingCount } from "@/lib/crm";

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

export default async function NetworkPage({
  params,
}: PageProps<"/kabinet/[handle]/tarmoq">) {
  const { handle } = await params;
  const { normalized, userId } = await requireOwnHandle(
    handle,
    "/kabinet/[handle]/tarmoq",
  );

  const contacts = await listContacts(normalized, userId);
  const stored = await getBrief(normalized, userId);
  const today = new Date();

  const ordered = byAttention(contacts, today);
  const waiting = waitingCount(contacts, today);
  const shape = shapeOf(contacts);

  // The briefing was written against references the model never saw resolved.
  // Names are attached here, on the owner's own server, from the owner's own
  // rows.
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
              ? { why: s.why, draft: s.draft, name: contact.name, contactId: contact.id }
              : null;
          })
          .filter((s): s is NonNullable<typeof s> => s !== null),
      }
    : null;

  return (
    <PageShell>
      <SubScreen handle={normalized} title="Tarmoq">
        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-flex-black/55">
          <span>
            <strong className="font-tabular text-flex-black">{shape.total}</strong> ta
            kontakt
          </span>
          <span>
            <strong className="font-tabular text-flex-black">{waiting}</strong> tasi
            javob kutmoqda
          </span>
          {shape.companies.length > 0 && (
            <span>
              Eng ko&apos;p: {shape.companies[0].name} ({shape.companies[0].count})
            </span>
          )}
        </div>

        <NetworkBrief handle={normalized} brief={brief} contactCount={contacts.length} />

        <div className="mt-6">
          <AddContactForm handle={normalized} />
        </div>

        {ordered.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-black/15 p-8 text-center text-sm text-flex-black/55">
            Hali hech kim kontaktini qoldirmagan. Kartangizni tegizgan odam
            o&apos;z ma&apos;lumotini shu yerga yuboradi.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {ordered.map((contact) => (
              <ContactRow
                key={contact.id}
                handle={normalized}
                contact={contact}
                reason={reasonFor(contact, today)}
              />
            ))}
          </ul>
        )}
      </SubScreen>
    </PageShell>
  );
}
