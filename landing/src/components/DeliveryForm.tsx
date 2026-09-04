"use client";

import { useActionState } from "react";
import { MapPin } from "lucide-react";

import { saveDelivery, type DeliveryState } from "@/app/kabinet/buyurtma/[id]/actions";

// The address, asked for once and asked for properly.
//
// Four fields rather than one box: a courier reads the region separately from
// the street, and a single textarea is how "Toshkent" ends up being the whole
// address. The recipient is asked for by name because these are bought as
// presents — defaulting to the account holder is how a ring arrives at the
// wrong door.

const field =
  "w-full rounded-2xl border border-black/12 px-4 py-3 text-sm outline-none placeholder:text-flex-black/30 focus:border-flex-black/40";
const label = "mb-1.5 block text-xs font-medium tracking-wide text-flex-black/50 uppercase";
const problem = "mt-1.5 text-xs text-red-700";

export default function DeliveryForm({ orderId }: { orderId: string }) {
  const [state, action, saving] = useActionState<DeliveryState, FormData>(
    saveDelivery,
    {},
  );

  if (state.saved) {
    return (
      <section className="rounded-3xl border border-lime/50 bg-lime/[0.08] p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold">Manzil saqlandi</h2>
        <p className="mt-2 text-sm leading-relaxed text-flex-black/60">
          Buyurtma navbatga qo&apos;yildi. Yasalgach yuboramiz va bu sahifada
          holatini ko&apos;rsatamiz.
        </p>
      </section>
    );
  }

  return (
    <form action={action} className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
      <input type="hidden" name="orderId" value={orderId} />

      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime">
          <MapPin className="h-4 w-4 text-flex-black" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Qayerga yuboraylik</h2>
          <p className="mt-1 text-sm leading-relaxed text-flex-black/55">
            Boshqa odamga sovg&apos;a bo&apos;lsa, uning ismini yozing.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="recipient" className={label}>
            Kim qabul qiladi
          </label>
          <input
            id="recipient"
            name="recipient"
            className={field}
            placeholder="Ism Familiya"
            autoComplete="name"
            required
          />
          {state.errors?.recipient && <p className={problem}>{state.errors.recipient}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={label}>
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            className={field}
            placeholder="+998 90 123 45 67"
            autoComplete="tel"
            required
          />
          {state.errors?.phone && <p className={problem}>{state.errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="region" className={label}>
            Viloyat yoki shahar
          </label>
          <input
            id="region"
            name="region"
            className={field}
            placeholder="Toshkent"
            autoComplete="address-level1"
            required
          />
          {state.errors?.region && <p className={problem}>{state.errors.region}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className={label}>
            Ko&apos;cha, uy, xonadon
          </label>
          <input
            id="address"
            name="address"
            className={field}
            placeholder="Chilonzor tumani, 12-kvartal, 4-uy, 17-xonadon"
            autoComplete="street-address"
            required
          />
          {state.errors?.address && <p className={problem}>{state.errors.address}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="note" className={label}>
            Kuryerga izoh — shart emas
          </label>
          <input
            id="note"
            name="note"
            className={field}
            placeholder="Kechqurun qo'ng'iroq qiling"
          />
        </div>
      </div>

      {state.error && <p className="mt-4 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 w-full rounded-2xl bg-flex-black px-6 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] disabled:opacity-50 sm:w-auto"
      >
        {saving ? "Saqlanyapti…" : "Saqlash"}
      </button>
    </form>
  );
}
