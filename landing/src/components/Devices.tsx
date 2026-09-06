import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import DeviceTile from "@/components/DeviceTile";
import { Link } from "@/i18n/navigation";
import { SHELF } from "@/lib/devices";

// What the number is carried on.
//
// Four, not the twenty-nine the old site rotated through in a carousel. A
// carousel says "we have twenty-nine"; a shelf says "you want this one".
// Somebody deciding whether to buy is choosing between a few things, and the
// rest of the catalogue is one click away for whoever wants it.
//
// All four are the same shot — object cut out, one lime line on it, centred on
// the same near-white ground at 900x900. That sameness is the point of a
// shelf: four photographs taken four ways read as four suppliers.
export default async function Devices() {
  const t = await getTranslations("devices");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="cap text-ink-3">{t("eyebrow")}</p>
      <p className="mt-2 max-w-xl text-ink-2">{t("note")}</p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {SHELF.map((device) => (
          <li key={device.slug}>
            <DeviceTile
              device={device}
              sizes="(min-width: 1024px) 276px, 50vw"
            />
          </li>
        ))}
      </ul>

      <Link
        href="/devices"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
      >
        {t("seeAll")}
        <ArrowRight className="size-4" strokeWidth={2} />
      </Link>
    </section>
  );
}
