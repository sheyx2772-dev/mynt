import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import DeviceTile from "@/components/DeviceTile";
import { DEVICES } from "@/lib/devices";
import { pageSeo } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/devices">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devices" });

  return {
    title: t("title"),
    description: t("lead"),
    // Its own address, its three siblings and the share card block.
    ...pageSeo("/devices", locale),
  };
}

// The whole shelf.
//
// The entry page shows four and this shows every one, which is the only
// difference between them: same tile, same photograph, same price. A catalogue
// that restyled its own products would be telling a visitor that the four on
// the front page are the real ones.
export default async function DevicesPage({
  params,
}: PageProps<"/[locale]/devices">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("devices");

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h1 className="text-[34px] leading-10 font-semibold tracking-tight sm:text-[42px] sm:leading-[3rem]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">{t("lead")}</p>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {DEVICES.map((device) => (
            <li key={device.slug}>
              <DeviceTile
                device={device}
                sizes="(min-width: 1024px) 368px, 50vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
