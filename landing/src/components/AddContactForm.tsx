"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import {
  addManualContact,
  type NetworkState,
} from "@/app/kabinet/[handle]/tarmoq/actions";

// A number taken on paper, entered by hand.
//
// Folded away until asked for, because the list is meant to fill itself and a
// form sitting open above it suggests otherwise. But it has to exist: a
// networking product that ignores the card somebody handed you at a conference
// gets kept alongside a notebook rather than replacing it.

const field =
  "w-full rounded-2xl border border-black/12 px-4 py-3 text-sm outline-none placeholder:text-flex-black/30 focus:border-flex-black/40";

export default function AddContactForm({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, saving] = useActionState<NetworkState, FormData>(
    addManualContact,
    {},
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-dashed border-black/20 px-5 py-3 text-sm text-flex-black/60 transition-colors hover:border-black/40"
      >
        <Plus className="h-4 w-4" />
        Kontakt qo&apos;shish
      </button>
    );
  }

  return (
    <form action={action} className="rounded-3xl border border-black/8 bg-white p-6">
      <input type="hidden" name="handle" value={handle} />

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" className={field} placeholder="Ism Familiya" required />
        <input name="company" className={field} placeholder="Kompaniya" />
        <input name="phone" className={field} placeholder="+998 90 123 45 67" inputMode="tel" />
        <input name="email" className={field} placeholder="email@misol.uz" inputMode="email" />
      </div>

      {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
      {state.done && <p className="mt-3 text-sm text-flex-black/60">Qo&apos;shildi.</p>}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-flex-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saqlanyapti…" : "Saqlash"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-2xl px-4 py-2.5 text-sm text-flex-black/50"
        >
          Yopish
        </button>
      </div>
    </form>
  );
}
