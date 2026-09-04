import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import PrintButton from "@/components/PrintButton";
import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue } from "@/lib/menu";
import { venueWords } from "@/lib/venue-words";
import { profileUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Chop etish — flex.com.uz", robots: { index: false } };

// The sheet that gets cut up and put on the tables.
//
// Deliberately not inside PageShell: this page exists to come out of a printer,
// so it has no brand mark, no dot grid and no bottom bar — every one of those
// is ink somebody pays for and a thing to cut around. What survives on paper is
// the venue's name, the number of the table, and the code.
//
// Each card carries a line telling the guest what the code does, because a
// square on a table with no explanation gets ignored.

export default async function PrintPointsPage({
  params,
}: PageProps<"/kabinet/[handle]/nuqtalar/chop">) {
  const { handle } = await params;
  const { normalized, userId } = await requireOwnHandle(
    handle,
    "/kabinet/[handle]/nuqtalar/chop",
  );

  const venue = await getOwnedVenue(normalized, userId);
  if (!venue) notFound();

  const w = venueWords(venue.kind, "uz");
  const action = w.actions.map((a) => a.label.toLowerCase()).join(", ");

  // What is printed under the code has to be the address the code actually
  // carries, or a guest who types it by hand lands somewhere else.
  const printed = profileUrl(normalized).replace(/^https?:\/\//, "");

  // "Stol 7" reads right; "Stol Terrasa 1" does not. A label somebody typed as
  // a name is already the whole name.
  const title = (point: string) => (/^\d+$/.test(point) ? `${w.pointPrefix} ${point}` : point);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 print:max-w-none print:p-0">
      <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/kabinet/${normalized}/nuqtalar`}
          className="inline-flex items-center gap-1.5 text-sm text-flex-black/50 transition-colors hover:text-flex-black"
        >
          <ArrowLeft className="h-4 w-4" />
          {w.pointsTitle}
        </Link>
        <PrintButton />
      </div>

      <p className="mb-6 text-sm text-flex-black/50 print:hidden">
        {venue.points.length} ta kartochka. Chop eting, qirqing va{" "}
        {w.pointPrefix.toLowerCase()} ustiga qo&apos;ying.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-3">
        {venue.points.map((point) => (
          <div
            key={point}
            className="flex break-inside-avoid flex-col items-center rounded-2xl border border-black/15 px-4 py-5 text-center print:rounded-none print:border-dashed"
          >
            <p className="text-[11px] font-semibold tracking-widest text-flex-black/45 uppercase">
              {venue.name}
            </p>
            <p className="mt-1 font-display font-tabular text-2xl font-semibold">
              {title(point)}
            </p>

            <div className="mt-3 w-full max-w-[8rem]">
              {/* eslint-disable-next-line @next/next/no-img-element -- an SVG route, not an optimizable asset */}
              <img
                src={`/${normalized}/qr?stol=${encodeURIComponent(point)}`}
                alt={`${venue.name} — ${title(point)}`}
                className="h-full w-full"
              />
            </div>

            <p className="mt-3 text-[11px] leading-snug text-flex-black/55">
              Kodni telefon kamerasi bilan oching — {w.listTitle.toLowerCase()}, {action}.
            </p>
            <p className="mt-1 font-tabular text-[10px] text-flex-black/35">
              {printed}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
