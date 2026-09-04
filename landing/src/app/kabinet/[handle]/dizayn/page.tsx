import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import DesignRequestForm from "@/components/DesignRequestForm";
import { requireOwnHandle } from "@/lib/kabinet";
import { listDesignRequests } from "@/lib/design-requests";

export const metadata: Metadata = { title: "Dizayn — flex.com.uz", robots: { index: false } };

export default async function DesignPage({ params }: PageProps<"/kabinet/[handle]/dizayn">) {
  const { handle } = await params;
  const { normalized } = await requireOwnHandle(handle, "/kabinet/[handle]/dizayn");
  const requests = await listDesignRequests(normalized);

  return (
    <PageShell>
      <SubScreen handle={normalized} title="Karta dizayni">
        <DesignRequestForm handle={normalized} requests={requests} />
      </SubScreen>
    </PageShell>
  );
}
