"use client";

import { useActionState, useState } from "react";
import { UtensilsCrossed, BedDouble, Store, Building2 } from "lucide-react";

import { createVenueAction } from "@/app/kabinet/[handle]/obyekt/actions";
import type { EditResult } from "@/lib/menu-edit";
import type { VenueKind } from "@/lib/venue-words";

// Choosing what the number is going to be.
//
// The choice is permanent in practice — it decides every noun on the guest's
// screen — so it is four cards with the words they will actually get, rather
// than a select nobody reads. A hotel owner should be able to see "Xizmatlar,
// Xona raqami, Tozalash" before committing.

const KINDS: { id: VenueKind; name: string; hint: string; Icon: typeof Store }[] = [
  {
    id: "cafe",
    name: "Kafe, restoran, choyxona",
    hint: "Menyu · Stol raqami · Ofitsiant, hisob",
    Icon: UtensilsCrossed,
  },
  {
    id: "hotel",
    name: "Mehmonxona, hostel",
    hint: "Xizmatlar · Xona raqami · Tozalash, xodim",
    Icon: BedDouble,
  },
  {
    id: "shop",
    name: "Do'kon, salon",
    hint: "Narxlar · Yordam so'rovi",
    Icon: Store,
  },
  {
    id: "other",
    name: "Boshqa",
    hint: "Ro'yxat va so'rovlar",
    Icon: Building2,
  },
];

const idle: EditResult = { ok: true };

export default function NewVenueForm({ handle }: { handle: string }) {
  const [kind, setKind] = useState<VenueKind>("cafe");
  const [state, action, busy] = useActionState(createVenueAction, idle);

  return (
    <form action={action}>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="kind" value={kind} />

      <label
        htmlFor="venue-name"
        className="mb-1 block text-[11px] font-medium tracking-wide text-paper-3 uppercase"
      >
        Obyekt nomi
      </label>
      <input
        id="venue-name"
        name="name"
        required
        placeholder="Choyxona Navro'z"
        className="w-full rounded-xl border border-ink-line bg-ink-s1 px-3 py-2.5 text-sm outline-none focus:border-flex-black/30"
      />

      <p className="mt-6 mb-2 text-[11px] font-medium tracking-wide text-paper-3 uppercase">
        Turi
      </p>

      <div className="space-y-2">
        {KINDS.map(({ id, name, hint, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            aria-pressed={kind === id}
            className={
              kind === id
                ? "flex w-full items-center gap-4 rounded-2xl border-2 border-flex-black bg-ink-s1 px-5 py-4 text-left"
                : "flex w-full items-center gap-4 rounded-2xl border border-ink-line bg-ink-s1 px-5 py-4 text-left transition-colors hover:bg-ink-s2"
            }
          >
            <Icon
              className={kind === id ? "h-5 w-5 text-paper" : "h-5 w-5 text-paper-3"}
              strokeWidth={1.7}
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{name}</span>
              <span className="mt-0.5 block text-xs text-paper-3">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      {!state.ok && <p className="mt-4 text-sm text-danger-ink">{state.error}</p>}

      <button
        disabled={busy}
        className="mt-6 w-full rounded-xl bg-lime px-5 py-3.5 font-medium text-ink disabled:opacity-60"
      >
        {busy ? "Ochilmoqda…" : "Obyektni ochish"}
      </button>
    </form>
  );
}
