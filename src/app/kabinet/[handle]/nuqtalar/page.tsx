import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import PointsEditor from "@/components/PointsEditor";
import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue } from "@/lib/menu";
import { venueWords } from "@/lib/venue-words";

export const metadata: Metadata = { title: "Nuqtalar — flex.com.uz", robots: { index: false } };

export default async function PointsPage({ params }: PageProps<"/kabinet/[handle]/nuqtalar">) {
  const { handle } = await params;
  const { normalized, userId } = await requireOwnHandle(handle, "/kabinet/[handle]/nuqtalar");

  const venue = await getOwnedVenue(normalized, userId);
  if (!venue) notFound();

  const w = venueWords(venue.kind, "uz");

  return (
    <PageShell>
      <SubScreen
        handle={normalized}
        title={w.pointsTitle}
        hint={`Har biriga o'z QR kodi va o'z NFC manzili tegadi — so'rov qaysi ${w.pointPrefix.toLowerCase()}dan kelganini shu hal qiladi.`}
      >
        <PointsEditor handle={normalized} points={venue.points} w={w} />
      </SubScreen>
    </PageShell>
  );
}
