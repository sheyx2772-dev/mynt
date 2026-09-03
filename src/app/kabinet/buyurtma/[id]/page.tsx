import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import DeliveryForm from "@/components/DeliveryForm";
import { requireUser } from "@/lib/auth";
import { getOwnOrder } from "@/lib/device-orders";
import { addressLine } from "@/lib/delivery";
import { fulfilmentForBuyer, step } from "@/lib/fulfilment";
import { catalogue } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Buyurtma — flex.com.uz",
  robots: { index: false },
};

export default async function OrderPage({ params }: PageProps<"/kabinet/buyurtma/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/kabinet/buyurtma/${id}`);

  // Ownership is a filter on the read, so somebody else's order is a 404 rather
  // than a refusal — a refusal has confirmed the order exists.
  const order = await getOwnOrder(user.id, id);
  if (!order) notFound();

  const device = catalogue("uz").devices[order.deviceType];
  const progress = step(order.fulfilment);
  const paid = order.status === "paid";

  return (
    <PageShell>
      <SubScreen handle={order.handle} title={device.name}>
        <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">{device.name}</p>
              <p className="mt-1 text-sm text-flex-black/55">
                {order.handle} · {formatUZS(order.amount, "uz")}
              </p>
            </div>
            <p className="text-sm text-flex-black/55">
              {paid ? fulfilmentForBuyer(order.fulfilment, "uz") : "To'lov kutilmoqda"}
            </p>
          </div>

          {/* Five dashes rather than a percentage: it is a small number of
              discrete stages, and a bar at 60% invites the question of what the
              other 40% is. */}
          {paid && progress && (
            <div className="mt-5 flex gap-1.5">
              {Array.from({ length: progress.of }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < progress.index
                      ? "h-1.5 flex-1 rounded-full bg-lime"
                      : "h-1.5 flex-1 rounded-full bg-black/10"
                  }
                />
              ))}
            </div>
          )}
        </section>

        {paid && order.fulfilment === "address_needed" && (
          <div className="mt-6">
            <DeliveryForm orderId={order.id} />
          </div>
        )}

        {order.recipient && order.region && order.address && (
          <section className="mt-6 rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Check className="h-4 w-4 text-lime-700" />
              Manzil
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-flex-black/70">
              {order.recipient}
              <br />
              {order.phone}
              <br />
              {addressLine({ region: order.region, address: order.address })}
              {order.note && (
                <>
                  <br />
                  <span className="text-flex-black/45">{order.note}</span>
                </>
              )}
            </p>
            {/* Deliberately not editable here. Once it is in the queue the
                address may already be on a label; changing it silently is worse
                than asking somebody. */}
            <p className="mt-4 text-xs text-flex-black/45">
              O&apos;zgartirish kerak bo&apos;lsa bizga yozing.
            </p>
          </section>
        )}
      </SubScreen>
    </PageShell>
  );
}
