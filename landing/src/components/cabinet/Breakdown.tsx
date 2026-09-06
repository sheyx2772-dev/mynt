import { count } from "@/lib/cabinet/format";

// A titled list of labels with a bar and a number — where views came from,
// which link was pressed. Bars are relative to the largest row, so the
// question "which one" is answered by the eye before the number is read.
export default function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  const top = Math.max(1, ...rows.map((r) => r.value));
  const sorted = [...rows].sort((a, b) => b.value - a.value);

  return (
    <section className="rounded-card bg-card p-4 sm:p-5">
      <h2 className="cap text-muted-foreground">{title}</h2>
      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {sorted.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{r.label}</span>
                <span className="font-mono tabular-nums">{count(r.value)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-1"
                  style={{ width: `${(r.value / top) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
