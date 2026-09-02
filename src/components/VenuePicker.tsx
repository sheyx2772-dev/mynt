"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import PhoneFrame from "@/components/PhoneFrame";
import VenueScreen from "@/components/VenueScreen";
import { formatUZS, formatNumber } from "@/lib/format";
import { venueScreen, type Lang, type B2BDict } from "@/lib/i18n";
import {
  VERTICALS,
  TYPICAL_POINTS,
  venueMonthly,
  perPointMonthly,
  bandFor,
  VENUE_BANDS,
  type VerticalId,
} from "@/lib/venues";

// The two decisions a venue owner makes, in one control: what kind of place
// this is, and how big it is. They are together because the answer to the
// second is priced and the first changes what the word "point" even means —
// twelve tables and thirty rooms are the same control and a different sentence.
//
// The price is computed here from venues.ts rather than written into the copy,
// so a band can never disagree with the table above it.

export default function VenuePicker({
  t,
  lang,
  shots,
  initial = "cafe",
}: {
  t: B2BDict;
  lang: Lang;
  /** Photography, when there is any. Resolved on the server; null is fine. */
  shots: Record<VerticalId, string | null>;
  initial?: VerticalId;
}) {
  const [vertical, setVertical] = useState<VerticalId>(initial);
  const [points, setPoints] = useState<number>(TYPICAL_POINTS[initial]);

  const v = t.verticals[vertical];
  const monthly = venueMonthly(points);
  const perPoint = perPointMonthly(points);
  const bandIndex = VENUE_BANDS.indexOf(bandFor(points));

  function pick(next: VerticalId) {
    setVertical(next);
    setPoints(TYPICAL_POINTS[next]);
  }

  return (
    <div>
      {/* Which kind of place */}
      <div role="tablist" aria-label={t.pickVertical} className="flex flex-wrap gap-2">
        {VERTICALS.map((id) => {
          const active = id === vertical;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pick(id)}
              className={
                active
                  ? "rounded-full bg-flex-black px-5 py-2.5 text-sm font-medium text-white"
                  : "rounded-full border border-black/12 px-5 py-2.5 text-sm text-flex-black/60 transition-colors hover:bg-black/[0.03]"
              }
            >
              {t.verticals[id].name}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-flex-black/55">{v.tagline}</p>

      {shots[vertical] && (
        <div className="relative mt-7 aspect-[21/9] overflow-hidden rounded-3xl bg-flex-black">
          {/* eslint-disable-next-line @next/next/no-img-element -- swapped on the client with the tab */}
          <img
            src={shots[vertical]!}
            alt={v.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* The screen itself, beside the lists that describe it. Reading
          "menyu, narx, allergen" and seeing the menu are not the same amount
          of explaining, and the personal side of the site already proved which
          one lands. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title={t.guestSide} items={[...v.guest]} />
          <Panel title={t.ownerSide} items={[...v.owner]} />
          {v.staff.length > 0 && (
            <div className="sm:col-span-2">
              <Panel title={t.staffSide} items={[...v.staff]} tone="gold" />
            </div>
          )}

          <div className="grain relative overflow-hidden rounded-3xl bg-flex-black p-6 text-white sm:col-span-2">
            <div className="bg-dot-grid-light absolute inset-0 opacity-30" />
            <h3 className="relative font-display text-xs font-semibold tracking-widest text-lime uppercase">
              {t.whyPay}
            </h3>
            <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
              {v.why.map((line) => (
                <p key={line} className="text-sm leading-relaxed text-white/60">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <PhoneFrame>
            <VenueScreen screen={venueScreen(lang, vertical)} vertical={vertical} />
          </PhoneFrame>
        </div>
      </div>

      {/* How big, and what that costs */}
      <div className="mt-10 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(14,10,27,0.3)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <label
              htmlFor="points"
              className="mb-2 block text-xs font-semibold tracking-widest text-flex-black/40 uppercase"
            >
              {t.pointsLabel} — {v.pointsWord}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="points"
                type="number"
                min={1}
                max={500}
                value={points}
                onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))}
                className="font-tabular w-28 rounded-2xl border-2 border-flex-black/90 px-4 py-3 text-center font-display text-xl font-semibold outline-none"
              />
              <input
                type="range"
                min={1}
                max={80}
                value={Math.min(points, 80)}
                aria-label={t.pointsLabel}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer accent-lime-ink"
              />
            </div>
          </div>

          <div className="text-right">
            {monthly === null ? (
              <>
                <p className="font-display text-2xl font-semibold tracking-tight">
                  {t.negotiated}
                </p>
                <p className="mt-1 max-w-xs text-xs text-flex-black/45">
                  {t.negotiatedNote}
                </p>
              </>
            ) : (
              <>
                <p className="rounded-2xl bg-lime px-5 py-3 font-display text-2xl font-semibold text-flex-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.7)]">
                  {formatUZS(monthly, lang)}
                </p>
                <p className="mt-2 font-tabular text-xs text-flex-black/45">
                  {t.monthlyWord}
                  {perPoint !== null && (
                    <>
                      {" · "}
                      {formatNumber(perPoint)} {t.perPointWord}
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </div>

        {/* The bands, with the one you are in marked. Seeing the next step up
            is the whole point of showing them at all. */}
        <div className="mt-7 grid gap-2 sm:grid-cols-3">
          {VENUE_BANDS.map((band, i) => (
            <div
              key={t.bandNames[i]}
              aria-current={i === bandIndex ? "true" : undefined}
              className={
                i === bandIndex
                  ? "rounded-2xl border-2 border-flex-black/90 px-4 py-3"
                  : "rounded-2xl border border-black/10 px-4 py-3 opacity-60"
              }
            >
              <p className="text-[11px] font-semibold tracking-widest text-flex-black/40 uppercase">
                {t.bandNames[i]}
              </p>
              <p className="mt-1 font-tabular font-display font-semibold">
                {band.monthly === null ? t.negotiated : formatUZS(band.monthly, lang)}
              </p>
            </div>
          ))}
        </div>

        {/* The picked vertical and size travel to the form, so nobody types
            them twice and the lead arrives already qualified. */}
        <a
          href={`#sorov?vertical=${vertical}&points=${points}`}
          onClick={(event) => {
            event.preventDefault();
            const form = document.getElementById("sorov");
            const verticalField = document.querySelector<HTMLSelectElement>(
              'select[name="vertical"]',
            );
            const pointsField = document.querySelector<HTMLInputElement>(
              'input[name="points"]',
            );
            if (verticalField) verticalField.value = vertical;
            if (pointsField) pointsField.value = String(points);
            form?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-flex-black px-6 py-4 font-medium text-white transition-transform hover:scale-[1.01]"
        >
          {t.askForThis}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function Panel({
  title,
  items,
  tone = "lime",
}: {
  title: string;
  items: string[];
  tone?: "lime" | "gold";
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6">
      <h3 className="text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed">
            <Check
              className={
                tone === "gold"
                  ? "mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                  : "mt-0.5 h-4 w-4 shrink-0 text-lime-ink"
              }
              strokeWidth={2.4}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
