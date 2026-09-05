import { BellRing, ReceiptText, Star, Sparkles, Check, Inbox } from "lucide-react";

import Plate from "@/components/ui/Plate";
import { timeAgo } from "@/lib/relative-time";
import { REQUEST_LABEL } from "@/lib/venue-words";
import type { RequestKind, VenueRequest } from "@/lib/venue-requests";

// What is waiting, and one button to end it.
//
// Two screens render this: the owner's, reached through the cabinet, and the
// counter's, reached through a secret link on a phone that never signs in. They
// have to stay identical — the whole point of the second one is that it is the
// same screen in the hands of the person who can actually walk to the table —
// so the markup lives here and each page supplies its own action and the hidden
// fields that authorise it.
//
// Both are the ink face, and both obey the same rule about the accent: exactly
// one lime on the screen, on the oldest thing still waiting. Every row lime
// meant a wall of it, which tells a waiter nothing about where to go first —
// and a screen that is always shouting is a screen somebody stops hearing.

function Icon({ kind }: { kind: RequestKind }) {
  const className = "h-5 w-5";
  if (kind === "bill") return <ReceiptText className={className} />;
  if (kind === "review") return <Star className={className} />;
  if (kind === "clean") return <Sparkles className={className} />;
  return <BellRing className={className} />;
}

export default function RequestList({
  requests,
  action,
  fields,
  emptyText = "Kutayotgan so'rov yo'q.",
}: {
  requests: VenueRequest[];
  /** Marks one request done. Each page passes the one it is allowed to call. */
  action: (form: FormData) => Promise<void>;
  /** Whatever that action needs to prove the caller may close a request. */
  fields: Record<string, string>;
  emptyText?: string;
}) {
  const waiting = requests.filter((r) => r.status === "new");
  const closed = requests.filter((r) => r.status === "done").slice(0, 30);

  // Oldest first, and the oldest is the one wearing the accent. A queue served
  // newest-first starves the table that has been waiting longest, which is the
  // one complaint a guest actually remembers.
  const queue = [...waiting].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );

  return (
    <>
      {queue.length === 0 ? (
        <div className="rounded-card border border-dashed border-ink-line px-6 py-12 text-center">
          <Inbox className="mx-auto h-6 w-6 text-paper-3" />
          <p className="mt-3 text-[16px] leading-6 text-paper-3">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((request, index) => {
            const first = index === 0;
            return (
              <div
                key={request.id}
                className={
                  first
                    ? "rounded-card bg-lime px-4 py-3.5 text-ink"
                    : "rounded-card border border-ink-line bg-ink-s1 px-4 py-3.5 text-paper"
                }
              >
                <div className="flex items-center gap-3">
                  {/* The table number is the answer to "where do I go", so it
                      is drawn the way every other number in the product is. On
                      the lime row it inverts, because a black plate on lime is
                      the same object seen against a different ground. */}
                  {first ? (
                    <span className="num inline-flex h-10 shrink-0 items-center rounded-plate bg-ink px-3 font-display text-[20px] font-bold tracking-[0.06em] text-paper">
                      {request.point ?? "—"}
                    </span>
                  ) : (
                    <Plate n={request.point ?? "—"} size="md" className="shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[16px] leading-6 font-semibold">
                      <Icon kind={request.kind} />
                      {REQUEST_LABEL[request.kind]}
                    </p>
                    <p
                      className={
                        first
                          ? "num text-[13px] leading-[18px] opacity-70"
                          : "num text-[13px] leading-[18px] text-paper-3"
                      }
                    >
                      {timeAgo(request.createdAt, "uz")}
                    </p>
                  </div>

                  <form action={action} className="shrink-0">
                    {Object.entries(fields).map(([name, value]) => (
                      <input key={name} type="hidden" name={name} value={value} />
                    ))}
                    <input type="hidden" name="id" value={request.id} />
                    <button
                      title="Bajarildi"
                      className={
                        first
                          ? "flex h-12 w-12 items-center justify-center rounded-input bg-ink text-paper transition-transform duration-[120ms] active:scale-[0.96]"
                          : "flex h-12 w-12 items-center justify-center rounded-input border border-ink-line bg-ink-s2 text-paper transition-transform duration-[120ms] active:scale-[0.96]"
                      }
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </form>
                </div>

                {(request.rating || request.note) && (
                  <div
                    className={
                      first
                        ? "mt-3 border-t border-ink/20 pt-3"
                        : "mt-3 border-t border-ink-line pt-3"
                    }
                  >
                    {request.rating && (
                      <p className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={
                              n <= request.rating!
                                ? first
                                  ? "h-4 w-4 fill-ink text-ink"
                                  : "h-4 w-4 fill-paper text-paper"
                                : first
                                  ? "h-4 w-4 text-ink/25"
                                  : "h-4 w-4 text-paper-3"
                            }
                          />
                        ))}
                      </p>
                    )}
                    {request.note && (
                      <p
                        className={
                          first
                            ? "mt-2 text-[16px] leading-6"
                            : "mt-2 text-[16px] leading-6 text-paper-2"
                        }
                      >
                        {request.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {closed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-[12px] leading-4 font-medium tracking-[0.04em] text-paper-3 uppercase">
            Bajarilgan
          </h2>
          <div className="divide-y divide-ink-line overflow-hidden rounded-card border border-ink-line">
            {closed.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 px-4 py-3 text-[14px] leading-5"
              >
                <span className="num w-14 shrink-0 text-paper-3">
                  {request.point ?? "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-paper-2">
                  {request.note || REQUEST_LABEL[request.kind]}
                </span>
                <span className="num shrink-0 text-[13px] text-paper-3">
                  {timeAgo(request.createdAt, "uz")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
