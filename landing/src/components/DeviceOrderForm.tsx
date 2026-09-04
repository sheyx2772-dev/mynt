"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";

import DevicePicker from "@/components/DevicePicker";
import { orderDevice, type OrderState } from "@/app/kabinet/[handle]/qurilma/actions";
import { DELIVERY } from "@/lib/company";
import { type DeviceTypeId } from "@/lib/devices";
import type { CardDesignId } from "@/lib/card-designs";

// Ordering the object. The picker is the same control the profile editor uses,
// because the choice is the same choice — which object, and how it looks — and
// a second one drawn slightly differently is how the preview and the parcel
// stop agreeing.

const button =
  "flex items-center justify-center gap-2 rounded-2xl bg-flex-black px-6 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] disabled:opacity-50";

export default function DeviceOrderForm({
  handle,
  device,
  design,
}: {
  handle: string;
  device: DeviceTypeId;
  design: CardDesignId;
}) {
  const [state, action, sending] = useActionState<OrderState, FormData>(
    orderDevice,
    {},
  );

  // Paid already, so the only thing left is the address. Sent as a link rather
  // than a redirect: the buyer has just come back from a payment page and
  // moving the ground under them again reads as a failure.
  if (state.next) {
    return (
      <section className="rounded-3xl border border-lime/50 bg-lime/[0.08] p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold">Buyurtma qabul qilindi</h2>
        <p className="mt-2 text-sm leading-relaxed text-flex-black/60">
          Qurilmani qayerga yuborishimizni yozing — shundan keyin yasashga
          o&apos;tadi.
        </p>
        <Link href={state.next} className={`${button} mt-5 w-full sm:w-auto`}>
          Manzilni yozish
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  if (state.checkout) {
    const { click, payme } = state.checkout;
    return (
      <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold">To&apos;lovni tanlang</h2>
        <p className="mt-2 text-sm leading-relaxed text-flex-black/55">
          To&apos;lovdan keyin manzilni so&apos;raymiz.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {payme && (
            <a href={payme} className={`${button} flex-1`}>
              Payme
            </a>
          )}
          {click && (
            <a href={click} className={`${button} flex-1`}>
              Click
            </a>
          )}
        </div>
      </section>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="handle" value={handle} />

      <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
        <DevicePicker handle={handle} device={device} design={design} prices />
      </section>

      <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
        {/* The prices are on the tiles, where the selection is. What is left
            to say here is how long it takes to arrive, which is the other
            question a buyer has at this point. */}
        <p className="flex items-center gap-2 text-sm text-flex-black/55">
          <Truck className="h-4 w-4" />
          Toshkentga {DELIVERY.tashkentDays} kun, viloyatlarga{" "}
          {DELIVERY.regionsDaysFrom}–{DELIVERY.regionsDaysTo} kun
        </p>

        {state.error && (
          <p className="mt-4 text-sm text-red-700">{state.error}</p>
        )}

        <button type="submit" disabled={sending} className={`${button} mt-5 w-full sm:w-auto`}>
          {sending ? "Yuborilyapti…" : "Buyurtma berish"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </form>
  );
}
