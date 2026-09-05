import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import PageShell from "@/components/PageShell";
import AutoRefresh from "@/components/AutoRefresh";
import RequestList from "@/components/RequestList";
import StaffLink from "@/components/StaffLink";
import { requireUser } from "@/lib/auth";
import { getOwnedVenue } from "@/lib/menu";
import { listVenueRequests } from "@/lib/venue-requests";
import { venueWords } from "@/lib/venue-words";
import { parseHandle } from "@/lib/pricing";
import { markDoneAction } from "./actions";

export const metadata: Metadata = {
  title: "So'rovlar — flex.com.uz",
  robots: { index: false },
};

// The owner's view of what is waiting.
//
// The same list the counter phone shows, because it is the same component —
// what differs is how the two prove they may close a request.

export default async function RequestsPage({
  params,
}: PageProps<"/kabinet/[handle]/sorovlar">) {
  const { handle } = await params;
  const parsed = parseHandle(handle);
  if (!parsed) notFound();

  const normalized = `${parsed.letters}${parsed.digits}`;
  const user = await requireUser(`/kabinet/${normalized}/sorovlar`);
  const venue = await getOwnedVenue(normalized, user.id);
  if (!venue) notFound();

  const words = venueWords(venue.kind, "uz");
  const requests = await listVenueRequests(venue.id);

  return (
    <PageShell surface="ink">
      <AutoRefresh />

      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href={`/kabinet/${normalized}`}
          className="flex items-center gap-2 text-sm font-medium text-paper-2 hover:text-paper"
        >
          <ArrowLeft className="h-4 w-4" />
          {normalized}
        </Link>
        <Link
          href={`/kabinet/${normalized}/menyu`}
          className="text-sm font-medium text-paper-2 hover:text-paper"
        >
          {words.listTitle}
        </Link>
      </div>

      <h1 className="font-display text-2xl font-semibold tracking-tight">So&apos;rovlar</h1>
      <p className="mt-1 mb-8 text-sm text-paper-2">
        {venue.name} — sahifa o&apos;zi yangilanadi.
      </p>

      <RequestList
        requests={requests}
        action={markDoneAction}
        fields={{ handle: normalized }}
      />

      <div className="mt-10">
        <StaffLink handle={normalized} token={venue.staffToken} />
      </div>
    </PageShell>
  );
}
