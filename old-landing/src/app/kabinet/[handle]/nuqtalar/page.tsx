import { redirect } from "next/navigation";
import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import PointsEditor from "@/components/PointsEditor";
import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue } from "@/lib/menu";
import { venueWords } from "@/lib/venue-words";

export const metadata: Metadata = { title: "Nuqtalar", robots: { index: false } };

export default async function PointsPage({ params }: PageProps<"/kabinet/[handle]/nuqtalar">) {
  const { handle } = await params;
  const { normalized, userId } = await requireOwnHandle(handle, "/kabinet/[handle]/nuqtalar");

  const venue = await getOwnedVenue(normalized);
  // Owning the number but not having made it a place is not an error — it is
  // the state every number starts in. Sending them to the screen that creates
  // one is what obyekt/page.tsx already does in the mirror case.
  if (!venue) redirect(`/kabinet/${normalized}/obyekt`);

  const w = venueWords(venue.kind, "uz");

  return (
    <PageShell surface="ink">
      <SubScreen
        handle={normalized}
        title={w.pointsTitle}
        hint={`Har biriga o'z QR kodi va o'z NFC manzili beriladi — so'rov qaysi ${w.pointPrefix.toLowerCase()}dan kelganini shu hal qiladi.`}
      >
        <PointsEditor handle={normalized} points={venue.points} w={w} />
      </SubScreen>
    </PageShell>
  );
}
