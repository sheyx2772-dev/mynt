import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Breakdown from "@/components/cabinet/Breakdown";
import DailyChart from "@/components/cabinet/DailyChart";
import HomeStats from "@/components/cabinet/HomeStats";
import PremiumTeaser from "@/components/cabinet/PremiumTeaser";
import SubScreen from "@/components/cabinet/SubScreen";
import WindowTabs from "@/components/cabinet/WindowTabs";
import { openScreen } from "@/lib/cabinet/screen";
import { report, windowOf } from "@/lib/cabinet/stats";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("stats.title") };
}

// How the number did, over a window the owner picks.
//
// Totals for everyone, the shape of them for premium. An owner has to be able
// to see that the card works at all — a card whose owner cannot tell whether
// anyone tapped it is a card they stop carrying — so the three figures are
// never behind the plan. What premium buys is the part that answers questions
// rather than counts: which day, which link, and whether the object they paid
// for is what brings people. That is the same line the backend's own plan
// notes draw (`internal/handles/plans.go`), and it is drawn in the interface
// rather than the API because the numbers are the owner's either way.
//
// The window is in the address, so a figure somebody is looking at has an
// address they can send.
export default async function StatsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/cabinet/[handle]/stats">) {
  const handle = await openScreen(params);
  const { days } = await searchParams;
  const window = windowOf(typeof days === "string" ? days : undefined);

  const [t, data] = await Promise.all([
    getTranslations("cabinet"),
    report(handle.raqam, window),
  ]);

  return (
    <SubScreen raqam={handle.raqam} title={t("sections.stats.title")}>
      <WindowTabs raqam={handle.raqam} current={window} />

      <div className="mt-4">
        <HomeStats
          views={data.jami_korishlar}
          visitors={data.jami_tashrifchilar_kunlik}
          taps={data.jami_bosishlar}
          caption={t("stats.window", { days: window })}
        />
      </div>

      {handle.tarif === "premium" ? (
        <div className="mt-6 flex flex-col gap-6">
          <DailyChart days={data.kunlar} />
          <Breakdown
            title={t("stats.sources")}
            rows={data.manbalar.map((s) => ({
              label: t.has(`stats.source.${s.manba}`)
                ? t(`stats.source.${s.manba}`)
                : s.manba,
              value: s.korishlar,
            }))}
          />
          <Breakdown
            title={t("stats.links")}
            rows={data.havolalar.map((l) => ({
              label: l.havola,
              value: l.bosishlar,
            }))}
          />
        </div>
      ) : (
        <PremiumTeaser />
      )}
    </SubScreen>
  );
}
