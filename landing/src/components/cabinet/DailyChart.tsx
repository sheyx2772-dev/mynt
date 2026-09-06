import { getTranslations } from "next-intl/server";

import { count, shortDay } from "@/lib/cabinet/format";

// Views per day, as columns.
//
// One series, one hue. Clicks are not plotted beside views: two series in a
// card this narrow need a legend and a second colour to say less than the
// per-link list underneath already says. Drawn with divs rather than a chart
// library, because forty bars and two labels do not need 200 kB on a 4G
// connection, and there is nothing to hover on a phone anyway — the busiest
// day is written out instead.
export default async function DailyChart({
  days,
}: {
  days: { kun: string; korishlar: number }[];
}) {
  const t = await getTranslations("cabinet.stats");
  const peak = Math.max(0, ...days.map((d) => d.korishlar));
  const busiest = days.find((d) => d.korishlar === peak && peak > 0);

  return (
    <section className="rounded-card bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="cap text-muted-foreground">{t("daily")}</h2>
        {busiest && (
          <p className="text-xs text-muted-foreground">
            {t("busiest", { day: shortDay(busiest.kun), count: count(peak) })}
          </p>
        )}
      </div>

      {peak === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("quiet")}
        </p>
      ) : (
        <div
          className="mt-4 flex h-32 items-end gap-px"
          role="img"
          aria-label={t("daily")}
        >
          {days.map((d) => (
            <div
              key={d.kun}
              title={`${shortDay(d.kun)}: ${count(d.korishlar)}`}
              className="min-w-0 flex-1 rounded-t-sm bg-chart-1"
              style={{
                height: `${Math.max(2, (d.korishlar / peak) * 100)}%`,
                opacity: d.korishlar ? 1 : 0.25,
              }}
            />
          ))}
        </div>
      )}

      {days.length > 1 && (
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>{shortDay(days[0].kun)}</span>
          <span>{shortDay(days[days.length - 1].kun)}</span>
        </div>
      )}
    </section>
  );
}
