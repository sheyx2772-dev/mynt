import { Eye, Nfc, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { count } from "@/lib/cabinet/format";

// Three figures for the last week with clear icons and fintech aesthetics.
export default async function HomeStats({
  views,
  visitors,
  taps,
  caption,
}: {
  views: number;
  visitors: number;
  taps: number;
  caption: string;
}) {
  const t = await getTranslations("cabinet.stats");

  const cells = [
    {
      label: t("views"),
      value: views,
      Icon: Eye,
      iconColor: "text-lime bg-lime/10 border-lime/20",
    },
    {
      label: t("visitors"),
      value: visitors,
      Icon: Users,
      iconColor: "text-sky-400 bg-sky-400/10 border-sky-400/20",
    },
    {
      label: t("taps"),
      value: taps,
      Icon: Nfc,
      iconColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    },
  ];

  return (
    <section aria-label={caption} className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 px-1">
        <span className="size-1.5 rounded-full bg-lime animate-pulse" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {caption}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {cells.map(({ label, value, Icon, iconColor }) => (
          <div
            key={label}
            className="flex flex-col justify-between rounded-card border border-border/70 bg-card p-3.5 transition-all hover:border-border hover:bg-card/90"
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex size-7 items-center justify-center rounded-lg border ${iconColor}`}
              >
                <Icon className="size-3.5" strokeWidth={2} />
              </span>
            </div>

            <div className="mt-3">
              <p className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl tabular-nums">
                {count(value)}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
