import type { ReactNode } from "react";

// The small pieces every screen in the panel is built from. Six of them, in one
// file, because a component library for four screens is more to read than the
// screens.

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-flex-black/10 p-5">{children}</div>;
}

export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      {/* Tabular figures, so a number changing does not shift the label under it. */}
      <p className="font-semibold text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-flex-black/50 text-sm">{label}</p>
    </Card>
  );
}

export function Waiting() {
  return <p className="py-12 text-center text-flex-black/40">Yuklanmoqda…</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-12 text-center text-flex-black/50">{children}</p>;
}

export function Failed({ children }: { children: ReactNode }) {
  return <p className="py-4 text-red-700 text-sm">{children}</p>;
}
