import { Wifi, Check } from "lucide-react";
import type { VenueScreenDict } from "@/lib/i18n";

// What the guest's phone actually shows, drawn rather than described.
//
// The personal side of the site learned this the hard way: the landing page
// talked about the profile for months and the section that finally drew one is
// the section that explains the product fastest. A restaurant owner reading
// "menyu, narx, allergen" is in the same position, so this is the menu.
//
// Rendered rather than photographed on purpose — it stays sharp at any size,
// it is in the reader's own language, and it cannot drift away from the product
// the way a screenshot taken once does.

export default function VenueScreen({
  screen,
  vertical,
}: {
  screen: VenueScreenDict;
  vertical: "cafe" | "hotel" | "other";
}) {
  return (
    <div className="w-full text-flex-black">
      {/* Who and where. The point is the whole trick: the page knows which
          table or room it was opened from. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight">
            {screen.venue}
          </p>
          <p className="mt-0.5 text-[11px] text-flex-black/40">flex.com.uz</p>
        </div>
        <span className="shrink-0 rounded-lg bg-flex-black px-2.5 py-1 font-tabular text-[11px] font-medium text-lime">
          {screen.point}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {screen.chips.map((chip, i) => (
          <span
            key={chip}
            className={
              i === 0 && vertical === "cafe"
                ? "rounded-full bg-flex-black px-2.5 py-1 text-[11px] font-medium text-white"
                : "rounded-full border border-black/10 px-2.5 py-1 text-[11px] text-flex-black/55"
            }
          >
            {vertical === "hotel" && i === 0 ? (
              <span className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-lime-ink" />
                {chip}
              </span>
            ) : (
              chip
            )}
          </span>
        ))}
      </div>

      {/* The rows. A dish and its price, a checkout time, a service and what it
          costs — the same three columns each time. */}
      <div className="mt-4 divide-y divide-black/6 border-y border-black/6">
        {screen.rows.map(([name, note, value], i) => (
          <div
            key={name}
            className={
              // One dish off the menu, to show the stop list is a real control
              // rather than a line in a feature list.
              vertical === "cafe" && i === 2
                ? "flex items-start justify-between gap-3 py-2.5 opacity-40"
                : "flex items-start justify-between gap-3 py-2.5"
            }
          >
            <div className="min-w-0">
              <p className="text-[13px] leading-tight font-medium">{name}</p>
              {note && (
                <p className="mt-0.5 text-[11px] leading-tight text-flex-black/40">{note}</p>
              )}
            </div>
            {value && (
              <p className="shrink-0 font-tabular text-[13px] font-semibold">{value}</p>
            )}
          </div>
        ))}
      </div>

      {screen.actions.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {screen.actions.map((action) => (
            <span
              key={action}
              className="rounded-xl border border-black/10 bg-black/[0.02] px-2.5 py-2 text-[11px] leading-tight font-medium"
            >
              {action}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-lime px-4 py-2.5 text-[13px] font-medium text-flex-black shadow-[0_10px_22px_-10px_rgba(171,255,9,0.9)]">
          <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
          {screen.primary}
        </div>
        <div className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-[13px] font-medium">
          {screen.secondary}
        </div>
      </div>
    </div>
  );
}
