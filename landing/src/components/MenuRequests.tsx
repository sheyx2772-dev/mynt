"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { BellRing, ReceiptText, Sparkles, Star, X, Check } from "lucide-react";

import { requestFromTable } from "@/app/[handle]/menu-actions";
import type { MenuBarDict } from "@/lib/i18n";
import type { VenueWords } from "@/lib/venue-words";
import type { RequestKind } from "@/lib/venue-requests";

// The half of a menu that paper cannot do.
//
// A guest reads the list and then wants one of three things: someone to come
// over, the bill, or to say something about the food. All three are one thumb
// on a bar that never leaves the bottom of the screen — the moment it needs
// scrolling back to, it stops being easier than raising a hand, which is the
// only competitor it has.
//
// The bar is portalled to the body. Fixed positioning is measured against the
// nearest ancestor with a filter, transform or backdrop-filter rather than the
// viewport, and a page like this grows those by decoration; the portal takes
// the question off the table for good.

type Kind = RequestKind;

/** Remembered so the bill does not ask for a table number the waiter already got. */
const POINT_KEY = "flex.point";

// Nothing here ever changes after the first paint, so there is nothing to
// subscribe to — these exist only to answer "am I in a browser yet" without a
// render pass whose whole job is to trigger a second one.
const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

function savedPoint(): string | null {
  try {
    return sessionStorage.getItem(POINT_KEY);
  } catch {
    // Private browsing refuses; typing the number again is the whole cost.
    return null;
  }
}

export default function MenuRequests({
  handle,
  point,
  s,
  w,
}: {
  handle: string;
  /** From the address on the tag: a table in a cafe, a room in a hotel. */
  point: string | null;
  s: MenuBarDict;
  /** What this vertical calls things, and which buttons it gets. */
  w: VenueWords;
}) {
  const [sheet, setSheet] = useState<Kind | null>(null);
  const [typed, setTyped] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const clear = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Both of these are questions about the browser, asked once, with an answer
  // for the server render that does not have one. Reading them in an effect
  // and storing the result would render twice to learn the same thing.
  const mounted = useSyncExternalStore(neverChanges, onClient, onServer);
  const remembered = useSyncExternalStore(neverChanges, savedPoint, () => null);

  // Typed beats the address, the address beats what the last request left.
  const table = typed ?? point ?? remembered ?? "";

  useEffect(() => () => {
    if (clear.current) clearTimeout(clear.current);
  }, []);

  const setTable = (value: string) => setTyped(value);

  function send(kind: Kind, chosenPoint: string) {
    setError(null);

    if (chosenPoint) {
      try {
        sessionStorage.setItem(POINT_KEY, chosenPoint);
      } catch {}
    }

    startTransition(async () => {
      const result = await requestFromTable({
        handle,
        point: chosenPoint || null,
        kind,
        rating: kind === "review" && rating > 0 ? rating : undefined,
        note: kind === "review" ? note : undefined,
      });

      if (!result.ok) {
        // "expired" reaches a guest only if the page was open when the month
        // ran out, and telling them about somebody else's invoice would be
        // rude — so it reads as the failure it is from where they stand.
        setError(result.error === "tooSoon" ? s.menuRequestTooSoon : s.menuRequestFailed);
        return;
      }

      setSheet(null);
      setNote("");
      setRating(0);
      setDone(kind);

      // The confirmation is the whole feedback; it goes away by itself so the
      // bar is ready when the same table wants the bill.
      if (clear.current) clearTimeout(clear.current);
      clear.current = setTimeout(() => setDone(null), 6000);
    });
  }

  function press(kind: Kind) {
    setError(null);
    // A request without a table is a request nobody can answer, and a review
    // is a form either way.
    if (kind === "review" || !table.trim()) {
      setSheet(kind);
      return;
    }
    send(kind, table.trim());
  }

  if (!mounted) return null;

  const confirmation =
    done === "review"
      ? s.menuReviewSent
      : done
        ? (w.actions.find((a) => a.kind === done)?.sent ?? s.menuRequestSent)
        : null;

  const bar = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-md">
        {confirmation && (
          <p className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-center text-sm font-medium text-flex-black shadow-lg">
            <Check className="h-4 w-4 shrink-0" />
            {confirmation}
          </p>
        )}

        {error && !sheet && (
          <p className="mb-2 rounded-xl bg-white px-4 py-2.5 text-center text-sm text-red-600 shadow-lg ring-1 ring-black/10">
            {error}
          </p>
        )}

        {/* A cafe gets two buttons, a shop one, and the review is always the
            third slot — so the columns are counted rather than written. */}
        <div
          className="grid gap-1.5 rounded-2xl bg-flex-black p-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)]"
          style={{ gridTemplateColumns: `repeat(${w.actions.length}, minmax(0, 1fr)) auto` }}
        >
          {w.actions.map((action, index) => (
            <button
              key={action.kind}
              type="button"
              onClick={() => press(action.kind)}
              disabled={pending}
              className={
                index === 0
                  ? "flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-semibold text-flex-black disabled:opacity-60"
                  : "flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              }
            >
              <ActionIcon kind={action.kind} />
              {action.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => press("review")}
            disabled={pending}
            aria-label={s.menuLeaveReview}
            className="flex items-center justify-center rounded-xl bg-white/10 px-3.5 py-3 text-white disabled:opacity-60"
          >
            <Star className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const asking = sheet !== null;

  const form = asking && (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Yopish"
        onClick={() => setSheet(null)}
        className="absolute inset-0 bg-flex-black/50"
      />

      <div className="relative w-full max-w-md rounded-t-[1.75rem] bg-white px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">
            {sheet === "review"
              ? s.menuLeaveReview
              : (w.actions.find((a) => a.kind === sheet)?.label ?? s.menuCallWaiter)}
          </h2>
          <button type="button" onClick={() => setSheet(null)} aria-label="Yopish">
            <X className="h-5 w-5 text-flex-black/40" />
          </button>
        </div>

        {/* Asked for once and then remembered. Everything after this is
            answerable — "table 7 wants the bill" reaches somebody, "somebody
            wants the bill" reaches nobody. */}
        <label htmlFor="req-point" className="mb-1 block text-[11px] font-medium tracking-wide text-flex-black/45 uppercase">
          {w.pointLabel}
        </label>
        <input
          id="req-point"
          value={table}
          onChange={(e) => setTable(e.target.value.slice(0, 12))}
          inputMode="numeric"
          autoFocus={!table}
          placeholder={w.pointPlaceholder}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-flex-black/30"
        />

        {sheet === "review" && (
          <>
            <div className="mt-4 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n}`}
                  className={
                    n <= rating
                      ? "flex h-11 flex-1 items-center justify-center rounded-xl bg-lime text-flex-black"
                      : "flex h-11 flex-1 items-center justify-center rounded-xl border border-black/10 text-flex-black/25"
                  }
                >
                  <Star className={n <= rating ? "h-5 w-5 fill-current" : "h-5 w-5"} />
                </button>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
              placeholder={s.menuReviewPlaceholder}
              className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-flex-black/30"
            />
          </>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={pending || (sheet !== "review" && !table.trim())}
          onClick={() => send(sheet, table.trim())}
          className="mt-4 w-full rounded-xl bg-flex-black px-5 py-3.5 font-medium text-white disabled:opacity-40"
        >
          {s.menuReviewSend}
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      {bar}
      {form}
    </>,
    document.body,
  );
}

function ActionIcon({ kind }: { kind: Kind }) {
  const className = "h-4 w-4";
  if (kind === "bill") return <ReceiptText className={className} />;
  if (kind === "clean") return <Sparkles className={className} />;
  return <BellRing className={className} />;
}
