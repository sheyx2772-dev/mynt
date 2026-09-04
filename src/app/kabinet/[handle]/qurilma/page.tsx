import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CreditCard, Package } from "lucide-react";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import DeviceOrderForm from "@/components/DeviceOrderForm";
import { requireOwnHandle } from "@/lib/kabinet";
import { listOwnOrders } from "@/lib/device-orders";
import { fulfilmentForBuyer } from "@/lib/fulfilment";
import { FulfilmentIcon } from "@/components/CrmIcon";
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
    <PageShell wide surface="ink">
      <SubScreen handle={normalized} title="Qurilma buyurtma qilish">
        <DeviceOrderForm
          handle={normalized}
          device={owned.deviceType ?? DEFAULT_DEVICE_TYPE}
          design={owned.cardDesign ?? DEFAULT_CARD_DESIGN}
        />

        {mine.length > 0 && (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-[12px] font-medium tracking-wide text-paper-3 uppercase">
              <Package className="h-3.5 w-3.5" />
              Buyurtmalaringiz
            </h2>
            <ul className="mt-3 space-y-2">
              {mine.map((order, i) => (
                <li
                  key={order.id}
                  className="rise"
                  style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                >
                  <Link
                    href={`/kabinet/buyurtma/${order.id}`}
                    className="flex items-center gap-3.5 rounded-2xl border border-ink-line bg-ink-s1 py-3.5 pr-4 pl-4 transition-shadow duration-300 hover:shadow-[0_6px_20px_-8px_rgba(14,10,27,0.18)]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-s2 text-paper">
                      {order.status === "pending" ? (
                        <CreditCard className="h-4 w-4" />
                      ) : (
                        <FulfilmentIcon state={order.fulfilment} className="h-4 w-4" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold tracking-tight">
                        {names[order.deviceType].name}
                        <span className="ml-2 font-tabular font-normal text-paper-3">
                          {formatUZS(order.amount, "uz")}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-paper-3">
                        {order.status === "pending"
                          ? "To'lov kutilmoqda"
                          : fulfilmentForBuyer(order.fulfilment, "uz")}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-paper-3" />
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
