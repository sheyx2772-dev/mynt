import { getTranslations } from "next-intl/server";

import { count } from "@/lib/cabinet/format";

// Three figures for the last week, and nothing to press.
//
// Seven days rather than all time, because "did anyone tap it" is a question
// about this week. The all-time count is on the statistics screen, where the
// chart gives it a shape.
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
    { label: t("views"), value: views },
    { label: t("visitors"), value: visitors },
    { label: t("taps"), value: taps },
  ];

  return (
    <section aria-label={caption}>
      <p className="cap mb-2 px-1 text-muted-foreground">{caption}</p>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="rounded-card bg-card px-4 py-3">
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {count(c.value)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
