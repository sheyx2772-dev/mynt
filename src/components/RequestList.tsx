import { BellRing, ReceiptText, Star, Sparkles, Check, Inbox } from "lucide-react";

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

function Icon({ kind }: { kind: RequestKind }) {
  const className = "h-4 w-4";
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

  return (
    <>
      {waiting.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 px-6 py-12 text-center">
          <Inbox className="mx-auto h-6 w-6 text-flex-black/25" />
          <p className="mt-3 text-sm text-flex-black/50">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {waiting.map((request) => (
            <div
              key={request.id}
              className="grain relative overflow-hidden rounded-2xl bg-flex-black px-5 py-4 text-white"
            >
              <div className="flex items-center gap-4">
                {/* The table number is the answer to "where do I go", so it is
                    the biggest thing on the row. */}
                <span className="shrink-0 rounded-xl bg-lime px-3 py-2 font-tabular text-lg leading-none font-semibold text-flex-black">
                  {request.point ?? "—"}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Icon kind={request.kind} />
                    {REQUEST_LABEL[request.kind]}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
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
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] text-white hover:bg-white/15"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                </form>
              </div>

              {(request.rating || request.note) && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  {request.rating && (
                    <p className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={
                            n <= request.rating!
                              ? "h-3.5 w-3.5 fill-lime text-lime"
                              : "h-3.5 w-3.5 text-white/20"
                          }
                        />
                      ))}
                    </p>
                  )}
                  {request.note && (
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{request.note}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
            Bajarilgan
          </h2>
          <div className="divide-y divide-black/6 rounded-2xl border border-black/10 bg-white">
            {closed.map((request) => (
              <div key={request.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-14 shrink-0 font-tabular text-flex-black/60">
                  {request.point ?? "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-flex-black/60">
                  {request.note || REQUEST_LABEL[request.kind]}
                </span>
                <span className="shrink-0 text-xs text-flex-black/35">
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
