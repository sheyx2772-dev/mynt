import { redirect } from "next/navigation";
import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import NewVenueForm from "@/components/NewVenueForm";
import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue } from "@/lib/menu";

export const metadata: Metadata = { title: "Obyekt — flex.com.uz", robots: { index: false } };

export default async function NewVenuePage({ params }: PageProps<"/kabinet/[handle]/obyekt">) {
  const { handle } = await params;
  const { normalized, userId } = await requireOwnHandle(handle, "/kabinet/[handle]/obyekt");

  // Already a place. This screen only exists to become one, so the list is
  // where they meant to go.
  const existing = await getOwnedVenue(normalized, userId);
  if (existing) redirect(`/kabinet/${normalized}/menyu`);

  return (
    <PageShell surface="ink">
      <SubScreen
        handle={normalized}
        title="Obyekt ochish"
        hint="Raqam odam emas, joy bo'ladi: uning ostida ro'yxat va stol yoki xonadan keladigan so'rovlar turadi."
      >
        <NewVenueForm handle={normalized} />
      </SubScreen>
    </PageShell>
  );
}
