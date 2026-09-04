import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import EditDishForm from "@/components/EditDishForm";
import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue, getMenu, getMenuItem } from "@/lib/menu";
import { venueWords } from "@/lib/venue-words";

export const metadata: Metadata = { title: "Tahrirlash — flex.com.uz", robots: { index: false } };

// One row, on its own screen.
//
// A form per row would have put twenty-nine of these on the list, on a phone
// held behind a counter. A row is small enough to scan and too small to edit
// in, so correcting one is a screen — which is also what makes room for the
// translations and the photograph without burying the price.
export default async function EditDishPage({
  params,
}: PageProps<"/kabinet/[handle]/menyu/[id]">) {
  const { handle, id } = await params;
  const { normalized, userId } = await requireOwnHandle(handle, "/kabinet/[handle]/menyu/[id]");

  const venue = await getOwnedVenue(normalized, userId);
  if (!venue) notFound();

  const item = await getMenuItem(venue.id, id);
  if (!item) notFound();

  const w = venueWords(venue.kind, "uz");
  const categories = await getMenu(venue.id, "uz");

  return (
    <PageShell surface="ink">
      <SubScreen handle={normalized} title={item.name} hint={w.itemWord}>
        <EditDishForm
          handle={normalized}
          item={item}
          categories={categories
            .filter((c) => c.id !== "boshqa")
            .map((c) => ({ id: c.id, name: c.name }))}
          w={w}
        />
      </SubScreen>
    </PageShell>
  );
}
