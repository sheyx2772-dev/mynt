import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import TransferPanel from "@/components/TransferPanel";
import { requireOwnHandle } from "@/lib/kabinet";
import { listTransfersForHandle } from "@/lib/transfers";

export const metadata: Metadata = { title: "O'tkazish — flex.com.uz", robots: { index: false } };

export default async function TransferPage({ params }: PageProps<"/kabinet/[handle]/otkazish">) {
  const { handle } = await params;
  const { normalized } = await requireOwnHandle(handle, "/kabinet/[handle]/otkazish");
  const transfers = await listTransfersForHandle(normalized);

  return (
    <PageShell>
      <SubScreen handle={normalized} title="Raqamni o'tkazish">
        <TransferPanel handle={normalized} transfers={transfers} />
      </SubScreen>
    </PageShell>
  );
}
