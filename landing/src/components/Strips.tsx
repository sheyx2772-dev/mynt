import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import LoadoutStrip, { type StripItem } from "@/components/LoadoutStrip";
import SampleStrip from "@/components/SampleStrip";

/**
 * The three shelves, and the line under them that opens the whole catalogue.
 *
 * Rendered once for both layouts, which is the point of the file. The entry
 * page draws a marketing page for a wide screen and an app for a phone, and
 * each of them used to carry its own copy of this block behind a `hidden`
 * class. That is fine for a heading and expensive here: twenty-one phone-sized
 * profile drawings, fourteen of them full organisation cards, built twice on
 * the server and parsed twice by a browser that will only ever show one.
 *
 * It sits between the two layouts' own blocks in the page rather than inside
 * either of them, so the sequence still reads correctly at both widths without
 * a single `order-*`: on a wide screen the fork above it and the residents
 * below it are visible and the app is not; on a phone it is the other way
 * round, and this block is the only thing both sequences share.
 */
export default function Strips({
  devices,
  verticals,
  labels,
  lang,
}: {
  devices: StripItem[];
  verticals: StripItem[];
  labels: {
    devices: string;
    devicesNote: string;
    directions: string;
    directionsNote: string;
    samples: string;
    samplesNote: string;
    samplesCta: string;
  };
  lang: "uz" | "ru" | "en";
}) {
  return (
    <div className="pt-4 lg:pt-0 lg:pb-6">
      {/* Whichever of the two products you are here for, the next question is
          which object. */}
      <LoadoutStrip items={devices} label={labels.devices} note={labels.devicesNote} />
      <LoadoutStrip items={verticals} label={labels.directions} note={labels.directionsNote} />

      {/* And the question after that: what their own page will look like. A
          shelf at a phone's size, because that one is answered by looking. */}
      <SampleStrip
        label={labels.samples}
        note={labels.samplesNote}
        open={labels.samplesCta}
        lang={lang}
      />

      {/* The same question in one line, for anybody who wants the catalogue
          rather than the shelf. */}
      <div className="mx-auto max-w-6xl px-6 pt-3 lg:pt-2">
        <Link
          href="/katalog?bolim=layouts"
          className="group flex items-center justify-between gap-4 rounded-card border border-line px-4 py-3 transition-colors active:bg-black/[0.04] lg:px-5 lg:py-4 lg:hover:bg-black/[0.03]"
        >
          <span>
            <span className="block text-[15px] font-semibold lg:text-base">{labels.samples}</span>
            <span className="block text-[13px] text-ink-2 lg:text-sm">{labels.samplesCta}</span>
          </span>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-ink-3 transition-transform lg:group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
