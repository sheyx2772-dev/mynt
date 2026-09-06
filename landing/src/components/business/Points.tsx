import { getTranslations } from "next-intl/server";
import { BarChart3, Inbox, MapPin } from "lucide-react";

// What is actually being bought, before any one trade is named.
//
// Every section below it describes the same three things wearing different
// words — a table is a point, a housekeeping call is a request, a busy hour is
// a report. Saying them once here is what lets a cafe owner skip the hotel
// section without missing how the product works.
export default async function Points() {
  const t = await getTranslations("business");

  const items = [
    { icon: MapPin, key: "Point" },
    { icon: Inbox, key: "Inbox" },
    { icon: BarChart3, key: "Report" },
  ] as const;

  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("howEyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("howTitle")}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
          {t("howLead")}
        </p>

        <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {items.map(({ icon: Icon, key }) => (
            <li key={key}>
              <Icon className="size-5 text-ink-3" strokeWidth={1.75} />
              <h3 className="mt-4 text-xl leading-6 font-semibold">
                {t(`how${key}Title`)}
              </h3>
              <p className="mt-2 leading-6 text-ink-2">{t(`how${key}Body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
