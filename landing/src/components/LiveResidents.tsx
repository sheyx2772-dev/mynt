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
    <section className="border-y border-white/10 bg-white/[0.03] py-5">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="font-tabular text-sm text-white/55">
            <span className="font-semibold text-white">{formatNumber(claimed)}</span>{" "}
            {labels.taken}
            <span className="mx-2 text-white/25">·</span>
            <span className="font-semibold text-white">
              {formatNumber(namespace - claimed)}
            </span>{" "}
            {labels.left}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-[0.14em] text-white/35 uppercase">
              {labels.latest}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {residents.map((r) => (
                <Link
                  key={r.normalized}
                  href={`/${r.normalized}`}
                  title={r.name}
                  className="rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1 font-tabular text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white"
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
