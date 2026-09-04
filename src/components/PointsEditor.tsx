"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Printer, Copy, Check } from "lucide-react";

import { savePointsAction } from "@/app/kabinet/[handle]/nuqtalar/actions";
import type { EditResult } from "@/lib/menu-edit";
import type { VenueWords } from "@/lib/venue-words";
import { pointUrl } from "@/lib/site-url";

// The list of tags a venue prints.
//
// One block of text rather than a screen of rows with add, rename, reorder and
// delete controls: the list is held in somebody's head as "1 to 12, plus two on
// the terrace", and typing that is faster than twelve clicks. A range helper
// fills the common half of it.
//
// Under it, every tag's full address — because the NFC chips are written from
// this list too, one at a time, by somebody holding a phone against a sticker.

const idle: EditResult = { ok: true };

export default function PointsEditor({
  handle,
  points,
  w,
}: {
  handle: string;
  points: string[];
  w: VenueWords;
}) {
  const [text, setText] = useState(points.join("\n"));
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("12");
  const [copied, setCopied] = useState<string | null>(null);
  const [state, action, busy] = useActionState(savePointsAction, idle);

  function fill() {
    const a = Number.parseInt(from, 10);
    const b = Number.parseInt(to, 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a || b - a > 499) return;

    const range = Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
    // Added to whatever is already there rather than replacing it, so a terrace
    // typed by hand survives filling in the numbered tables.
    const existing = text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    const merged = [...existing, ...range.filter((n) => !existing.includes(n))];
    setText(merged.join("\n"));
  }

  const saved = points.length > 0;

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="handle" value={handle} />

        <div className="rounded-2xl border border-ink-line bg-ink-s1 p-5">
          <p className="mb-1 text-[11px] font-medium tracking-wide text-paper-3 uppercase">
            Raqamlab to&apos;ldirish
          </p>
          <div className="flex items-center gap-2">
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              inputMode="numeric"
              aria-label="Boshlanishi"
              className="w-20 rounded-xl border border-ink-line px-3 py-2.5 text-center font-tabular text-sm outline-none focus:border-flex-black/30"
            />
            <span className="text-paper-3">—</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              inputMode="numeric"
              aria-label="Tugashi"
              className="w-20 rounded-xl border border-ink-line px-3 py-2.5 text-center font-tabular text-sm outline-none focus:border-flex-black/30"
            />
            <button
              type="button"
              onClick={fill}
              className="rounded-xl border border-ink-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-ink-s2"
            >
              Qo&apos;shish
            </button>
          </div>

          <label
            htmlFor="points"
            className="mt-5 mb-1 block text-[11px] font-medium tracking-wide text-paper-3 uppercase"
          >
            Ro&apos;yxat — har qatorda bittadan
          </label>
          <textarea
            id="points"
            name="points"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={`1\n2\n3\nTerrasa 1`}
            className="w-full resize-y rounded-xl border border-ink-line bg-ink-s1 px-3 py-2.5 font-tabular text-sm outline-none focus:border-flex-black/30"
          />

          {!state.ok && <p className="mt-3 text-sm text-danger-ink">{state.error}</p>}

          <button
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-ink-s2 px-5 py-3 font-medium text-paper disabled:opacity-60"
          >
            {busy ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </div>
      </form>

      {saved && (
        <>
          <Link
            href={`/kabinet/${handle}/nuqtalar/chop`}
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-lime px-5 py-4 font-medium text-ink transition-transform active:scale-[0.99]"
          >
            <Printer className="h-4 w-4" />
            {points.length} ta {w.pointPrefix.toLowerCase()}ni chop etish
          </Link>

          {/* The same list as addresses, for writing the NFC chips. A chip is
              written one at a time with a phone held against it, so the address
              has to be copyable one at a time. */}
          <section className="mt-8">
            <h2 className="mb-1 text-xs font-semibold tracking-widest text-paper-3 uppercase">
              NFC uchun manzillar
            </h2>
            <p className="mb-3 text-sm text-paper-2">
              Har bir chipga o&apos;ziniki yoziladi.
            </p>

            <div className="divide-y divide-ink-line rounded-2xl border border-ink-line bg-ink-s1">
              {points.map((point) => {
                // Exactly what the QR carries, except that a chip records
                // itself as a tap rather than a scan.
                const url = pointUrl(handle, point, "nfc");
                return (
                  <div key={point} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-16 shrink-0 font-tabular text-sm font-semibold">
                      {point}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-tabular text-xs text-paper-3">
                      {url}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(url);
                          setCopied(point);
                        } catch {
                          // Denied, or an insecure origin. The address is on
                          // screen either way.
                        }
                      }}
                      aria-label="Nusxalash"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-line text-paper-2 hover:bg-ink-s2"
                    >
                      {copied === point ? (
                        <Check className="h-4 w-4 text-lime" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
