import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import LeadsPanel from "@/components/LeadsPanel";
import StatsPanel from "@/components/StatsPanel";
import { requireOwnHandle } from "@/lib/kabinet";
import { listLeads } from "@/lib/leads";
import { getHandleStats } from "@/lib/analytics";

export const metadata: Metadata = { title: "Statistika — flex.com.uz", robots: { index: false } };

// Contacts before counts: a name and a phone number is something to act on
// today, and a thirty-day chart is something to look at.
export default async function StatsPage({ params }: PageProps<"/kabinet/[handle]/statistika">) {
  const { handle } = await params;
  const { normalized, owned, userId } = await requireOwnHandle(
    handle,
    "/kabinet/[handle]/statistika",
  );

  const [stats, leads] = await Promise.all([
    getHandleStats(normalized),
    listLeads(normalized, userId),
  ]);

  return (
    <PageShell>
      <SubScreen handle={normalized} title="Statistika va kontaktlar">
        <LeadsPanel handle={normalized} leads={leads} plan={owned.plan} />
        <StatsPanel stats={stats} plan={owned.plan} />
      </SubScreen>
    </PageShell>
  );
}
