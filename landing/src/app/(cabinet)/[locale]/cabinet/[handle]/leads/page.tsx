import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import LeadList from "@/components/cabinet/LeadList";
import SubScreen from "@/components/cabinet/SubScreen";
import { listLeads } from "@/lib/cabinet/leads";
import { openScreen } from "@/lib/cabinet/screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("leads.title") };
}

// Leads / visitor contact exchange entries.
//
// Shows people who left their contacts on the public profile.
export default async function LeadsPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const handle = await openScreen(params);
  const t = await getTranslations("cabinet.sections.leads");
  const leads = await listLeads(handle.raqam);

  return (
    <SubScreen
      raqam={handle.raqam}
      title={t("title")}
      hint={t("hint")}
    >
      <LeadList
        raqam={handle.raqam}
        initialLeads={leads}
        emptyTitle={t("emptyTitle")}
        emptyHint={t("emptyHint")}
        downloadCsvLabel={t("downloadCsv")}
        deleteSuccessLabel={t("deleted")}
      />
    </SubScreen>
  );
}
