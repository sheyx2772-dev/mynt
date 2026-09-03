import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, CreditCard, MapPin } from "lucide-react";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import DeliveryForm from "@/components/DeliveryForm";
import { FulfilmentIcon } from "@/components/CrmIcon";
import { requireUser } from "@/lib/auth";
import { getOwnOrder } from "@/lib/device-orders";
import { addressLine } from "@/lib/delivery";
import { fulfilmentForBuyer, fulfilmentLabel, type Fulfilment } from "@/lib/fulfilment";
import { catalogue } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Buyurtma — flex.com.uz",
  robots: { index: false },
};

// One order, as the person waiting for it.
//
// The stages are drawn as a track rather than a bar. Five discrete things
// happen to a parcel and each has a name; a bar at 60% invites the question of
// what the other 40% is, and answers it with nothing.

const TRACK: readonly Fulfilment[] = [
  "address_needed",
  "queued",
  "making",
  "shipped",
  "delivered",
];

export default async function OrderPage({ params }: PageProps<"/kabinet/buyurtma/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/kabinet/buyurtma/${id}`);

  // Ownership is a filter on the read, so somebody else's order is a 404 rather
  // than a refusal — a refusal has confirmed the order exists.
  const order = await getOwnOrder(user.id, id);
  if (!order) notFound();

  const device = catalogue("uz").devices[order.deviceType];
  const paid = order.status === "paid";
  const reached = TRACK.indexOf(order.fulfilment);
  const returned = order.fulfilment === "returned";

  return (
    <PageShell>
      <SubScreen handle={order.handle} title={device.name}>
        <section className="grain relative overflow-hidden rounded-[1.75rem] bg-flex-black p-6 text-white sm:p-7">
          <div className="bg-dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_100%_0%,black,transparent)]" />
          <div className="card-sheen absolute inset-0" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[22px] leading-tight font-semibold tracking-tight">
                  {device.name}
                </p>
                <p className="mt-1 font-tabular text-[13px] text-white/45">
                  {order.handle} · {formatUZS(order.amount, "uz")}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-medium">
                {paid ? (
                  <>
                    <FulfilmentIcon state={order.fulfilment} className="h-3 w-3" />
                    {fulfilmentLabel(order.fulfilment, "uz")}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3 w-3" />
                    To&apos;lanmagan
                  </>
                )}
              </span>
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-lime">
              {paid ? fulfilmentForBuyer(order.fulfilment, "uz") : "To'lov kutilmoqda"}
            </p>

            {/* Five named steps, not a percentage. A returned parcel is left
                off the track entirely rather than drawn as progress toward
                being sent back. */}
            {paid && !returned && (
              <ol className="mt-6 flex gap-1.5">
                {TRACK.map((state, i) => {
                  const done = i <= reached;
                  return (
                    <li key={state} className="flex-1">
                      <span
                        className={
                          done
                            ? "block h-1 rounded-full bg-lime"
                            : "block h-1 rounded-full bg-white/15"
                        }
                      />
                      <span
                        className={
                          i === reached
                            ? "mt-2 flex items-center gap-1 text-[10px] font-medium text-lime"
                            : "mt-2 flex items-center gap-1 text-[10px] text-white/25"
                        }
                      >
                        <FulfilmentIcon state={state} className="h-3 w-3" />
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        {paid && order.fulfilment === "address_needed" && (
          <div className="mt-5">
            <DeliveryForm orderId={order.id} />
          </div>
        )}

        {order.recipient && order.region && order.address && (
          <section className="mt-5 rounded-[1.5rem] border border-black/6 bg-white p-6">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-flex-black/40 uppercase">
              <MapPin className="h-3.5 w-3.5" />
              Manzil
            </h2>
            <div className="mt-3 flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime">
                <Check className="h-3.5 w-3.5 text-flex-black" />
              </span>
              <p className="text-[14px] leading-relaxed">
                <span className="font-semibold">{order.recipient}</span>
                <br />
                <span className="text-flex-black/60">{order.phone}</span>
                <br />
                <span className="text-flex-black/60">
                  {addressLine({ region: order.region, address: order.address })}
                </span>
                {order.note && (
                  <>
                    <br />
                    <span className="text-flex-black/35">{order.note}</span>
                  </>
                )}
              </p>
            </div>
            {/* Deliberately not editable here. Once it is in the queue the
                address may already be on a label, and changing it silently is
                worse than asking somebody. */}
            <p className="mt-4 text-[12px] text-flex-black/40">
              O&apos;zgartirish kerak bo&apos;lsa bizga yozing.
            </p>
          </section>
        )}
      </SubScreen>
    </PageShell>
  );
}
