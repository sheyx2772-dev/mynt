import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { day } from "@/lib/cabinet/format";
import type { DeviceOrder } from "@/lib/cabinet/orders";
import { money } from "@/lib/devices";

// One order: what, for which number, where it has got to.
//
// The stage is a word from the backend's own vocabulary and is translated by
// key; a stage this build does not know is shown as it came, because a new
// step in the workshop should not read as a blank on the customer's screen.
const STAGES = new Set([
  "pending",
  "paid",
  "address_needed",
  "queued",
  "making",
  "shipped",
  "delivered",
  "returned",
]);

export default async function OrderRow({
  order,
  locale,
}: {
  order: DeviceOrder;
  locale: string;
}) {
  const t = await getTranslations("cabinet.orders");
  const stage = order.bosqich || order.holat;
  const known = STAGES.has(stage);

  return (
    <li className="flex items-center gap-3 rounded-card bg-card p-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">
          {t.has(`device.${order.qurilma}`)
            ? t(`device.${order.qurilma}`)
            : order.qurilma}
          <span className="ml-2 font-mono text-xs tracking-[0.12em] text-muted-foreground">
            {order.raqam}
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {day(order.vaqt, locale)} · {money(order.summa)} {t("soum")}
        </span>
      </span>
      <Badge
        variant={
          stage === "shipped" || stage === "delivered" ? "default" : "secondary"
        }
      >
        {known ? t(`stage.${stage}`) : stage}
      </Badge>
    </li>
  );
}
