import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package, Phone } from "lucide-react";

import PageShell from "@/components/PageShell";
import { FulfilmentIcon } from "@/components/CrmIcon";
import { requireOperator } from "@/lib/operator";
import { listQueue } from "@/lib/device-orders";
import { moveOrder } from "@/app/kabinet/buyurtmalar/actions";
import {
  advanceLabel,
  fulfilmentLabel,
  nextStates,
  usualNext,
  type Fulfilment,
} from "@/lib/fulfilment";
import { addressLine } from "@/lib/delivery";
import { catalogue, type Lang } from "@/lib/i18n";
import { cardDesign } from "@/lib/card-designs";
import { formatUZS } from "@/lib/format";
import { timeAgo } from "@/lib/relative-time";

export const metadata: Metadata = {
  title: "Buyurtmalar — flex.com.uz",
  robots: { index: false },
};

const LANG: Lang = "uz";

// The queue whoever makes these works from.
//
// One row per order and everything needed to fill it on that row: what to make,
// which design to print, where it goes and a number that dials. Nothing behind
// a click, because the person reading this has a printer in front of them and a
// parcel to pack, and a detail page is one more place to lose their position.

const CHIP: Record<Fulfilment, string> = {
  address_needed: "bg-amber-50 text-amber-800",
  queued: "bg-black/[0.05] text-flex-black/60",
  making: "bg-lime text-flex-black",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-black/[0.05] text-flex-black/45",
  returned: "bg-red-50 text-red-700",
};

const STRIPE: Record<Fulfilment, string> = {
  address_needed: "bg-amber-400",
  queued: "bg-black/15",
  making: "bg-lime",
  shipped: "bg-blue-400",
  delivered: "bg-black/10",
  returned: "bg-red-500",
};

export default async function QueuePage() {
  await requireOperator("/kabinet/buyurtmalar");
  const orders = await listQueue();
  const names = catalogue(LANG).devices;

  const needAddress = orders.filter((o) => o.fulfilment === "address_needed").length;
  const toMake = orders.filter(
    (o) => o.fulfilment === "queued" || o.fulfilment === "making",
  ).length;

  return (
    <PageShell wide>
      <div className="w-full">
        <Link
          href="/kabinet"
          className="inline-flex items-center gap-1.5 text-[13px] text-flex-black/45 transition-colors hover:text-flex-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Kabinet
        </Link>

        {/* The count, on the brand's own ground. A queue rendered as a white
            page is a spreadsheet; this is the screen somebody opens to find out
            what their morning is. */}
        <section className="grain relative mt-4 overflow-hidden rounded-[1.75rem] bg-flex-black p-6 text-white sm:p-7">
          <div className="bg-dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_100%_0%,black,transparent)]" />
          <div className="card-sheen absolute inset-0" />

          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-white/40 uppercase">
              <Package className="h-3.5 w-3.5" />
              Yasash va yuborish
            </div>

            <div className="mt-2 flex items-end gap-3">
              <p className="font-display text-[52px] leading-[0.9] font-semibold tracking-tight text-lime">
                {orders.length}
              </p>
              {orders.length > 0 && (
                <span className="halo mb-2 h-2 w-2 rounded-full bg-lime" aria-hidden />
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/45">
              {toMake > 0 && (
                <span className="flex items-center gap-1.5">
                  <FulfilmentIcon state="making" className="h-3.5 w-3.5" />
                  <span className="font-tabular text-white">{toMake}</span> yasash
                  kerak
                </span>
              )}
              {needAddress > 0 && (
                <span className="flex items-center gap-1.5">
                  <FulfilmentIcon state="address_needed" className="h-3.5 w-3.5" />
                  <span className="font-tabular text-white">{needAddress}</span> manzil
                  kutmoqda
                </span>
              )}
              {orders.length === 0 && <span>Hammasi yetkazilgan</span>}
            </div>
          </div>
        </section>

        {orders.length === 0 ? (
          <section className="mt-6 rounded-[1.75rem] border border-black/6 bg-white p-10 text-center">
            <p className="font-display text-[17px] font-semibold tracking-tight">
              Navbat bo&apos;sh
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-flex-black/50">
              To&apos;langan buyurtma kelganda shu yerda paydo bo&apos;ladi va
              Telegramga xabar keladi.
            </p>
          </section>
        ) : (
          <ul className="mt-6 space-y-3">
            {orders.map((order, i) => {
              const next = usualNext(order.fulfilment);
              const others = nextStates(order.fulfilment).slice(1);
              const hasAddress = order.recipient && order.region && order.address;

              return (
                <li
                  key={order.id}
                  className="rise relative overflow-hidden rounded-2xl border border-black/6 bg-white transition-shadow duration-300 hover:shadow-[0_6px_20px_-8px_rgba(14,10,27,0.18)]"
                  style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-[3px] ${STRIPE[order.fulfilment]}`}
                  />

                  <div className="flex items-center gap-3.5 py-4 pr-4 pl-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flex-black text-white">
                      <FulfilmentIcon state={order.fulfilment} className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold tracking-tight">
                        {names[order.deviceType].name}
                        {order.design && (
                          <span className="ml-2 font-normal text-flex-black/45">
                            {cardDesign(order.design).name}
                          </span>
                        )}
                      </p>
                      {/* Wraps rather than truncating: "250 00…" reads as a
                          broken price, and the row has the height for a second
                          line. */}
                      <p className="mt-0.5 text-[12px] leading-snug text-flex-black/45">
                        <Link
                          href={`/${order.handle}`}
                          className="font-medium text-flex-black/70 hover:underline"
                        >
                          {order.handle}
                        </Link>
                        {" · "}
                        {formatUZS(order.amount, LANG)}
                        {order.paidAt && ` · ${timeAgo(order.paidAt, LANG)}`}
                      </p>
                    </div>

                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${CHIP[order.fulfilment]}`}
                    >
                      <FulfilmentIcon state={order.fulfilment} className="h-3 w-3" />
                      {fulfilmentLabel(order.fulfilment, LANG)}
                    </span>
                  </div>

                  <div className="border-t border-black/6 px-5 py-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6">
                    {hasAddress ? (
                      <div className="text-[13px] leading-relaxed">
                        <p className="font-semibold">{order.recipient}</p>
                        <p className="text-flex-black/60">
                          {addressLine({
                            region: order.region as string,
                            address: order.address as string,
                          })}
                        </p>
                        {order.note && (
                          <p className="mt-1 text-flex-black/40">{order.note}</p>
                        )}
                        {order.phone && (
                          <a
                            href={`tel:${order.phone.replace(/[^0-9+]/g, "")}`}
                            className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-black/[0.04] px-3 py-2 text-[12px] font-medium transition-colors hover:bg-black/[0.07]"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {order.phone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900">
                        <FulfilmentIcon
                          state="address_needed"
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        Xaridor hali manzil yozmagan. Yasashga o&apos;tmaydi.
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:flex-col sm:items-stretch">
                      {next && (
                        <form action={moveOrder}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="to" value={next} />
                          <button
                            type="submit"
                            className="flex items-center gap-1.5 rounded-xl bg-flex-black px-4 py-2 text-[12px] font-semibold text-white shadow-[0_6px_18px_-8px_rgba(14,10,27,0.7)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
                          >
                            <FulfilmentIcon state={next} className="h-3.5 w-3.5" />
                            {advanceLabel(order.fulfilment, LANG)}
                          </button>
                        </form>
                      )}
                      {/* The unusual moves sit beside the usual one rather than
                          hidden: a parcel does come back, and hunting for the
                          button that says so is how it stays marked delivered. */}
                      {others.map((state) => (
                        <form action={moveOrder} key={state}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="to" value={state} />
                          <button
                            type="submit"
                            className="flex items-center gap-1.5 rounded-xl bg-black/[0.04] px-4 py-2 text-[12px] text-flex-black/55 transition-colors hover:bg-black/[0.08] hover:text-flex-black"
                          >
                            <FulfilmentIcon state={state} className="h-3.5 w-3.5" />
                            {fulfilmentLabel(state, LANG)}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
