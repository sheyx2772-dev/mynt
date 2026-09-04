import type { Metadata } from "next";
import { after } from "next/server";
import { Car, Dog, Inbox, MapPin, Package, Phone } from "lucide-react";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import TagList from "@/components/TagList";
import { requireOwnHandle } from "@/lib/kabinet";
import { listTagMessages, listTags, markMessagesRead } from "@/lib/object-tags";
import { tagWords, type TagKind } from "@/lib/tags";
import { timeAgo } from "@/lib/relative-time";

export const metadata: Metadata = {
  title: "Buyumlar — flex.com.uz",
  robots: { index: false },
};

// The owner's side of the object tags.
//
// Two things on one screen because they are one thought: the things that carry
// a tag, and what strangers have said through them. Splitting them would mean
// somebody has to know which screen a message arrives on.

const ICON: Record<TagKind, typeof Car> = { car: Car, pet: Dog, thing: Package };

export default async function TagsPage({
  params,
}: PageProps<"/kabinet/[handle]/buyumlar">) {
  const { handle } = await params;
  const { normalized, userId } = await requireOwnHandle(
    handle,
    "/kabinet/[handle]/buyumlar",
  );

  const [tags, messages] = await Promise.all([
    listTags(normalized, userId),
    listTagMessages(normalized, userId),
  ]);

  const kindOf = new Map(tags.map((t) => [t.id, t.kind]));
  const labelOf = new Map(tags.map((t) => [t.id, t.label]));
  const unread = tags.reduce((sum, t) => sum + t.unread, 0);

  // Marked read after the page has been sent, not before it is built: the
  // count above is what was unread when they opened it.
  after(async () => {
    if (unread > 0) await markMessagesRead(normalized, userId);
  });

  return (
    <PageShell wide surface="ink">
      <SubScreen handle={normalized} title="Buyumlar">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-ink-s2 p-6 text-paper sm:p-7">

          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-paper uppercase">
              <Inbox className="h-3.5 w-3.5" />
              Yangi xabar
            </div>
            <div className="mt-2 flex items-end gap-3">
              <p className="font-display text-[52px] leading-[0.9] font-semibold tracking-tight text-lime">
                {unread}
              </p>
              {unread > 0 && (
                <span className="mb-2 h-2 w-2 rounded-full bg-lime" aria-hidden />
              )}
            </div>
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-paper">
              Mashinangizga, hayvoningizga yoki buyumingizga belgi qo&apos;ying.
              Tegizgan odam profilingizni emas, sizga xabar yozadigan ekranni
              ko&apos;radi — telefon raqamlar ikki tomonga ham ko&apos;rinmaydi.
            </p>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <h2 className="mb-3 text-[12px] font-medium tracking-wide text-paper-3 uppercase">
              Belgilangan buyumlar
            </h2>
            <TagList handle={normalized} tags={tags} />
          </div>

          <div>
            <h2 className="mb-3 text-[12px] font-medium tracking-wide text-paper-3 uppercase">
              Kelgan xabarlar
            </h2>

            {messages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ink-line p-8 text-center text-[13px] text-paper-3">
                Hozircha xabar yo&apos;q.
              </p>
            ) : (
              <ul className="space-y-2">
                {messages.map((message, i) => {
                  const kind = kindOf.get(message.tagId) ?? "thing";
                  const Icon = ICON[kind];
                  const words = tagWords(kind, "uz");

                  return (
                    <li
                      key={message.id}
                      className="rise rounded-2xl border border-ink-line bg-ink-s1 p-4"
                      style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-s2">
                          <Icon className="h-3.5 w-3.5 text-paper-2" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold tracking-tight">
                            {words.actions[message.kind]}
                          </p>
                          <p className="mt-0.5 text-[12px] text-paper-3">
                            {[labelOf.get(message.tagId), timeAgo(message.createdAt, "uz")]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        {!message.readAt && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime" />
                        )}
                      </div>

                      {message.place && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-paper-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {message.place}
                        </p>
                      )}

                      {message.body && (
                        <p className="mt-2 border-l-2 border-ink-line pl-3 text-[13px] leading-relaxed text-paper-2">
                          {message.body}
                        </p>
                      )}

                      {/* The only way back, and only because the sender chose
                          to give it. */}
                      {message.replyTo && (
                        <a
                          href={`tel:${message.replyTo.replace(/[^0-9+]/g, "")}`}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-ink-s2 px-3.5 py-2 text-[12px] font-semibold text-paper transition-transform hover:scale-[1.02]"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {message.replyTo}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </SubScreen>
    </PageShell>
  );
}
