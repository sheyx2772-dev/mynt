import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { DEVICES, money } from "@/lib/devices";

// The shelf as a price list.
//
// Names come from the `devices` catalogue rather than being written again
// here: one name per object, in one place, or a ring is a ring on the shelf
// and a band on the price list.
export default async function DevicePrices() {
  const t = await getTranslations("pricingPage");
  const d = await getTranslations("devices");

  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
          {t("devicesTitle")}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
          {t("devicesBody")}
        </p>

        <ul className="mt-8 max-w-xl">
          {DEVICES.map((device) => (
            <li
              key={device.slug}
              className="flex items-baseline justify-between gap-4 border-b border-line-soft py-3.5 last:border-0"
            >
              <span className="text-sm font-medium">
                {d(`items.${device.slug}.name`)}
              </span>
              <span className="font-mono text-sm font-semibold whitespace-nowrap">
                {money(device.price)}{" "}
                <span className="font-sans text-[13px] font-normal text-ink-3">
                  {t("soum")}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/devices"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
        >
          {t("devicesAll")}
          <ArrowRight className="size-4" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
