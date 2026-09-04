import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import EditCategoryForm from "@/components/EditCategoryForm";
import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue, getMenuCategory } from "@/lib/menu";
import { venueWords } from "@/lib/venue-words";

export const metadata: Metadata = { title: "Bo'lim — flex.com.uz", robots: { index: false } };

export default async function EditCategoryPage({
  params,
}: PageProps<"/kabinet/[handle]/menyu/bolim/[id]">) {
  const { handle, id } = await params;
  const { normalized, userId } = await requireOwnHandle(
    handle,
    "/kabinet/[handle]/menyu/bolim/[id]",
  );

  const venue = await getOwnedVenue(normalized, userId);
  if (!venue) notFound();

  const category = await getMenuCategory(venue.id, id);
  if (!category) notFound();

  return (
    <PageShell>
      <SubScreen handle={normalized} title={category.name} hint="Bo'lim nomi">
        <EditCategoryForm
          handle={normalized}
          category={category}
          w={venueWords(venue.kind, "uz")}
        />
      </SubScreen>
    </PageShell>
  );
}
