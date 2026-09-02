import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";

import PageShell from "@/components/PageShell";
import HandleHub from "@/components/HandleHub";
import { requireOwnHandle } from "@/lib/kabinet";
import { getHandleStats } from "@/lib/analytics";
import { listLeads } from "@/lib/leads";
import { getOwnedVenue } from "@/lib/menu";
import { countWaiting } from "@/lib/venue-requests";

export async function generateMetadata(
  props: PageProps<"/kabinet/[handle]">
): Promise<Metadata> {
  const { handle } = await props.params;
  return { title: `${handle.toUpperCase()} — flex.com.uz`, robots: { index: false } };
}

// One number's home screen, reached from the cabinet or directly.
//
// Everything this page used to render inline is now a screen behind a tile;
// what stays here is the number, what it did, and the way in.
export default async function HandlePage(props: PageProps<"/kabinet/[handle]">) {
  const { handle } = await props.params;
  const { normalized, owned, userId } = await requireOwnHandle(handle, "/kabinet/[handle]");

  const [today, leads, venue] = await Promise.all([
    getHandleStats(normalized, 1),
    listLeads(normalized, userId),
    getOwnedVenue(normalized, userId),
  ]);

  const waiting = venue ? await countWaiting(venue.id) : 0;

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/kabinet"
          className="inline-flex items-center gap-1.5 text-sm text-flex-black/50 transition-colors hover:text-flex-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Kabinet
        </Link>
        <Link
          href={`/${normalized}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-flex-black/60 transition-colors hover:text-flex-black"
        >
          Profilni ko&apos;rish
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <HandleHub
        handle={owned}
        todayViews={today.totalViews}
        leads={leads.length}
        venue={venue}
        waiting={waiting}
      />
    </PageShell>
  );
}
