import Link from "next/link";
import type { Resident } from "@/lib/handles";
import { formatNumber } from "@/lib/format";

// Who has just joined, and how much of the namespace is gone.
//
// This replaces an invented statistic. The landing page carried a badge reading
// "BU HAFTA — 2 481 tashrif", which was a number typed into the markup and
// connected to nothing. A commercial page is the wrong place to make one up,
// and it was also the weaker move: a figure that changes because people are
// buying does the same job honestly and does it better.
//
// Everything here is read from the database at request time. When nobody has
// claimed a handle yet the strip does not render at all, rather than showing
// zeros — an empty shop is not proof of anything.

export default function LiveResidents({
  residents,
  claimed,
  namespace,
  labels,
}: {
  residents: Resident[];
  claimed: number;
  namespace: number;
  labels: { taken: string; left: string; latest: string };
}) {
  if (residents.length === 0) return null;

  return (
    <section className="border-y border-ink-line bg-white/[0.03] py-5">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="font-tabular text-sm text-paper-2">
            <span className="font-semibold text-white">{formatNumber(claimed)}</span>{" "}
            {labels.taken}
            <span className="mx-2 text-paper-3">·</span>
            <span className="font-semibold text-white">
              {formatNumber(namespace - claimed)}
            </span>{" "}
            {labels.left}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-[0.14em] text-paper-3 uppercase">
              {labels.latest}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {residents.map((r) => (
                <Link
                  key={r.normalized}
                  href={`/${r.normalized}`}
                  title={r.name}
                  className="rounded-plate border border-ink-line bg-white/[0.06] px-2.5 py-2.5 font-tabular text-xs text-paper-2 transition-colors hover:border-paper-3 hover:text-white"
                >
                  {r.normalized}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
