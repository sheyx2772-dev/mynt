import { notFound } from "next/navigation";
import type { Metadata } from "next";

import CounterHeader from "@/components/CounterHeader";
import RequestList from "@/components/RequestList";
import CounterAlert from "@/components/CounterAlert";
import { getVenueByStaffToken } from "@/lib/menu";
import { listVenueRequests } from "@/lib/venue-requests";
import { markDoneFromCounter } from "./actions";

// Never indexed, and never named. The title would otherwise put a venue's name
// in a browser history that belongs to a shared phone.
export const metadata: Metadata = {
  title: "So'rovlar",
  robots: { index: false, follow: false },
};

// The screen left open on the counter.
//
// No sign-in, no navigation, nothing to wander off into: this is a phone
// propped up by the till, and everything that is not the list of waiting tables
// is something to tap by accident. It refreshes itself, because nobody is going
// to pull it down.
export default async function CounterPage({ params }: PageProps<"/z/[token]">) {
  const { token } = await params;

  const venue = await getVenueByStaffToken(token);
  // A wrong token and a rotated one get the same answer as a made-up one.
  if (!venue) notFound();

  const requests = await listVenueRequests(venue.id);
  const waiting = requests.filter((r) => r.status === "new");

  return (
    <div className="mx-auto min-h-full max-w-md px-5 py-6">
      {/* Not one of our screens: a phone propped up by a till has nowhere to
          navigate to, and the bar would be four things to tap by accident. */}
      <span data-no-app-bar hidden />
      {/* The name, the count and the connection together: the count is only
          true while the phone is connected, and the header is where that has
          to be said. */}
      <CounterHeader venueName={venue.name} waiting={waiting.length} seconds={10} />

      {/* The ids rather than the count: two closed and two arrived is not a
          quiet minute, and a count would call it one. */}
      <CounterAlert waiting={waiting.map((r) => r.id)} />

      <RequestList
        requests={requests}
        action={markDoneFromCounter}
        fields={{ token }}
        emptyText="Hozircha chaqiruv yo'q."
      />
    </div>
  );
}
