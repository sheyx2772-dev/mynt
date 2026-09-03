import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";

import PageShell from "@/components/PageShell";
import { requireOperator } from "@/lib/operator";
import { listQueue } from "@/lib/device-orders";
import { moveOrder } from "@/app/kabinet/buyurtmalar/actions";
import {
  advanceLabel,
  fulfilmentLabel,
  nextStates,
  usualNext,
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
// One row per order, and everything needed to fill it on that row: what to
// make, which design to print, where it goes and who to ring. Nothing is behind
// a click, because the person reading this has a printer in front of them and a
// parcel to pack, and a detail page is one more thing to lose their place in.

export default async function QueuePage() {
  await requireOperator("/kabinet/buyurtmalar");
  const orders = await listQueue();
  const names = catalogue(LANG).devices;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-6">
        <Link
          href="/kabinet"
          className="inline-flex items-center gap-1.5 text-sm text-flex-black/50 hover:text-flex-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Kabinet
        </Link>

        <h1 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
          Buyurtmalar
        </h1>
        <p className="mt-2 text-sm text-flex-black/55">
          To&apos;langan va hali yetkazilmagan qurilmalar. Eng eskisi yuqorida.
        </p>

        {orders.length === 0 ? (
          <p className="mt-10 rounded-3xl border border-black/8 bg-white p-8 text-sm text-flex-black/55">
            Hozircha bajarilishi kerak bo&apos;lgan buyurtma yo&apos;q.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {orders.map((order) => {
              const next = usualNext(order.fulfilment);
              const others = nextStates(order.fulfilment).slice(1);

              return (
                <li
                  key={order.id}
                  className="rounded-3xl border border-black/8 bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-semibold">
                        {names[order.deviceType].name}
                        {order.design && (
                          <span className="ml-2 font-normal text-flex-black/50">
                            {cardDesign(order.design).name}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-sm text-flex-black/55">
                        <Link
                          href={`/${order.handle}`}
                          className="font-medium text-flex-black hover:underline"
                        >
                          {order.handle}
                        </Link>
                        {" · "}
                        {formatUZS(order.amount, LANG)}
                        {order.paidAt && ` · ${timeAgo(order.paidAt, LANG)}`}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-black/[0.06] px-3 py-1 text-xs text-flex-black/60">
                      {fulfilmentLabel(order.fulfilment, LANG)}
                    </span>
                  </div>

                  {order.recipient && order.region && order.address ? (
                    <div className="mt-4 rounded-2xl bg-black/[0.03] p-4 text-sm leading-relaxed">
                      <p className="font-medium">{order.recipient}</p>
                      <p className="text-flex-black/70">
                        {addressLine({ region: order.region, address: order.address })}
                      </p>
                      {order.note && (
                        <p className="mt-1 text-flex-black/45">{order.note}</p>
                      )}
                      {order.phone && (
                        <a
                          href={`tel:${order.phone.replace(/[^0-9+]/g, "")}`}
                          className="mt-2 inline-flex items-center gap-1.5 font-medium text-flex-black hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {order.phone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                      Xaridor hali manzil yozmagan. Yasashga o&apos;tmaydi.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {next && (
                      <form action={moveOrder}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="to" value={next} />
                        <button
                          type="submit"
                          className="rounded-xl bg-flex-black px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
                        >
                          {advanceLabel(order.fulfilment, LANG)}
                        </button>
                      </form>
                    )}
                    {/* The unusual moves are here rather than hidden: a parcel
                        does come back, and hunting for the button that says so
                        is how it stays marked as delivered. */}
                    {others.map((state) => (
                      <form action={moveOrder} key={state}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="to" value={state} />
                        <button
                          type="submit"
                          className="rounded-xl border border-black/12 px-4 py-2 text-sm text-flex-black/70 transition-colors hover:border-black/30"
                        >
                          {fulfilmentLabel(state, LANG)}
                        </button>
                      </form>
                    ))}
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
