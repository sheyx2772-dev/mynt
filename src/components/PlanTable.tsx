import { Check } from "lucide-react";
import { PLANS, yearlyMonthsFree } from "@/lib/plans";
import { formatUZS } from "@/lib/format";

// The two plans side by side. The free one is listed first and in full, because
// it is what every buyer gets and hiding it makes the paid one look compulsory.
export default function PlanTable() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {PLANS.map((p) => {
        const paid = p.monthly > 0;
        return (
          <div
            key={p.id}
            className={
              paid
                ? "rounded-3xl border border-flex-black bg-flex-black p-7 text-white"
                : "rounded-3xl border border-black/10 bg-white p-7"
            }
          >
            <h3 className="font-display text-lg font-semibold">{p.name}</h3>
            <p className={`mt-1 text-sm ${paid ? "text-white/50" : "text-flex-black/50"}`}>
              {p.tagline}
            </p>

            <p className="mt-6 font-display text-3xl font-semibold tracking-tight">
              {paid ? formatUZS(p.monthly) : "Bepul"}
              {paid && (
                <span className={`ml-1 text-sm font-normal ${paid ? "text-white/45" : ""}`}>
                  / oyiga
                </span>
              )}
            </p>
            {paid && (
              <p className="mt-1 text-xs text-white/45">
                Yiliga {formatUZS(p.yearly)} &mdash; {yearlyMonthsFree()} oy bepul
              </p>
            )}

            <ul className="mt-6 space-y-2.5">
              {p.includes.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed">
                  <Check
                    className={`mt-0.5 h-4 w-4 shrink-0 ${paid ? "text-lime" : "text-lime-ink"}`}
                  />
                  <span className={paid ? "text-white/75" : "text-flex-black/65"}>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
