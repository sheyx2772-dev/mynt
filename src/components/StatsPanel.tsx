import type { HandleStats } from "@/lib/analytics";

// Headline numbers first, then a single-series column chart of daily visits.
// Clicks are not plotted alongside visits: two series in a card this narrow
// would need a legend and a second colour to say less than the per-link
// breakdown underneath already says.

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3">
      <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-mynt-black/45">{label}</p>
    </div>
  );
}

function dayLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

export default function StatsPanel({ stats }: { stats: HandleStats }) {
  const peak = Math.max(...stats.daily.map((d) => d.views), 0);
  const busiest = stats.daily.find((d) => d.views === peak && peak > 0);

  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
      <h2 className="font-display text-lg font-semibold tracking-tight">Statistika</h2>
      <p className="mt-1 text-sm text-mynt-black/50">So&apos;nggi 30 kun.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatTile label="Tashrif" value={stats.totalViews} />
        <StatTile label="Tashrifchi" value={stats.totalVisitors} />
        <StatTile label="Bosish" value={stats.totalClicks} />
      </div>

      {peak === 0 ? (
        <p className="mt-7 rounded-2xl border border-dashed border-black/12 px-4 py-6 text-center text-sm text-mynt-black/45">
          Hali tashrif yo&apos;q. Profilingizni ulashganingizdan keyin bu yerda kunlik
          statistika paydo bo&apos;ladi.
        </p>
      ) : (
        <figure className="mt-7">
          <figcaption className="mb-3 text-xs text-mynt-black/45">
            Kunlik tashriflar
            {busiest && (
              <>
                {" — eng ko'p "}
                <span className="font-medium text-mynt-black/70">
                  {dayLabel(busiest.day)} kuni {peak} ta
                </span>
              </>
            )}
          </figcaption>

          {/* Columns sit on a hairline baseline, 2px of surface between each. */}
          <div
            className="flex h-28 items-end gap-[2px] border-b border-black/10"
            role="img"
            aria-label={`So'nggi 30 kunda ${stats.totalViews} ta tashrif`}
          >
            {stats.daily.map((d) => (
              <div
                key={d.day}
                title={`${dayLabel(d.day)} — ${d.views} tashrif, ${d.clicks} bosish`}
                className="flex-1 rounded-t-[4px] bg-lime-ink transition-opacity hover:opacity-70"
                style={{
                  // A quiet day draws nothing; the solid hairline underneath is
                  // the axis. Drawing a stub for every empty day turned that
                  // axis into a dashed line, which reads as chrome, not data.
                  height: d.views === 0 ? 0 : `${Math.max(6, (d.views / peak) * 100)}%`,
                }}
              />
            ))}
          </div>

          <div className="mt-2 flex justify-between font-tabular text-[11px] text-mynt-black/35">
            <span>{dayLabel(stats.daily[0]!.day)}</span>
            <span>{dayLabel(stats.daily[stats.daily.length - 1]!.day)}</span>
          </div>
        </figure>
      )}

      {stats.links.length > 0 && (
        <div className="mt-7">
          <h3 className="mb-3 text-xs font-medium tracking-wide text-mynt-black/45 uppercase">
            Havolalar bo&apos;yicha
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {stats.links.map((link) => (
                <tr key={link.label} className="border-t border-black/5">
                  <td className="py-2.5 text-mynt-black/70">{link.label}</td>
                  <td className="py-2.5 text-right font-tabular font-medium">{link.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {peak > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-xs text-mynt-black/45">
            Kunlik raqamlar jadvali
          </summary>
          <table className="mt-3 w-full font-tabular text-xs">
            <thead>
              <tr className="text-mynt-black/45">
                <th className="py-1 text-left font-medium">Kun</th>
                <th className="py-1 text-right font-medium">Tashrif</th>
                <th className="py-1 text-right font-medium">Bosish</th>
              </tr>
            </thead>
            <tbody>
              {stats.daily
                .filter((d) => d.views > 0 || d.clicks > 0)
                .map((d) => (
                  <tr key={d.day} className="border-t border-black/5">
                    <td className="py-1.5">{dayLabel(d.day)}</td>
                    <td className="py-1.5 text-right">{d.views}</td>
                    <td className="py-1.5 text-right">{d.clicks}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}
