import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import DeviceOrderForm from "@/components/DeviceOrderForm";
import { requireOwnHandle } from "@/lib/kabinet";
import { listOwnOrders } from "@/lib/device-orders";
import { fulfilmentForBuyer, fulfilmentLabel } from "@/lib/fulfilment";
import { catalogue } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";
import { DEFAULT_DEVICE_TYPE } from "@/lib/devices";
import { DEFAULT_CARD_DESIGN } from "@/lib/card-designs";

export const metadata: Metadata = {
  title: "Qurilma buyurtma qilish — flex.com.uz",
  robots: { index: false },
};

export default async function DeviceOrderPage({
  params,
}: PageProps<"/kabinet/[handle]/qurilma">) {
  const { handle } = await params;
  const { normalized, owned, userId } = await requireOwnHandle(
    handle,
    "/kabinet/[handle]/qurilma",
  );

  // The form opens on what the profile already shows, so ordering the object
  // that matches the card on screen takes no clicks at all.
  const orders = await listOwnOrders(userId);
  const mine = orders.filter((order) => order.handle === normalized);
  const names = catalogue("uz").devices;

  return (
    <PageShell>
      <SubScreen handle={normalized} title="Qurilma buyurtma qilish">
        <DeviceOrderForm
          handle={normalized}
          device={owned.deviceType ?? DEFAULT_DEVICE_TYPE}
          design={owned.cardDesign ?? DEFAULT_CARD_DESIGN}
        />

        {mine.length > 0 && (
          <section className="mt-8 rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold">
              Buyurtmalaringiz
            </h2>
            <ul className="mt-4 divide-y divide-black/8">
              {mine.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/kabinet/buyurtma/${order.id}`}
                    className="flex items-center gap-4 py-4 transition-colors hover:bg-black/[0.02]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {names[order.deviceType].name}
                        <span className="ml-2 font-normal text-flex-black/45">
                          {formatUZS(order.amount, "uz")}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-flex-black/55">
                        {order.status === "pending"
                          ? "To'lov kutilmoqda"
                          : fulfilmentForBuyer(order.fulfilment, "uz")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-black/[0.06] px-3 py-1 text-xs text-flex-black/60">
                      {order.status === "pending"
                        ? "To'lanmagan"
                        : fulfilmentLabel(order.fulfilment, "uz")}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-flex-black/30" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </SubScreen>
    </PageShell>
  );
}
