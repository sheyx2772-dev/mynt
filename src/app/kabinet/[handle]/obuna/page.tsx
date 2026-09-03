import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import VenuePlanPanel from "@/components/VenuePlanPanel";
import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue } from "@/lib/menu";
import { planState, listVenueInvoices } from "@/lib/venue-billing";
import { venueMonthly } from "@/lib/venues";
import { venueWords } from "@/lib/venue-words";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Obuna — flex.com.uz", robots: { index: false } };

export default async function SubscriptionPage({
  params,
}: PageProps<"/kabinet/[handle]/obuna">) {
  const { handle } = await params;
  const { normalized, userId } = await requireOwnHandle(handle, "/kabinet/[handle]/obuna");

  const venue = await getOwnedVenue(normalized, userId);
  if (!venue) notFound();

  const w = venueWords(venue.kind, "uz");
  const plan = planState(venue.planExpiresAt);
  const points = Math.max(1, venue.points.length);
  const invoices = await listVenueInvoices(venue.id);

  return (
    <PageShell>
      <SubScreen handle={normalized} title="Obuna" hint={venue.name}>
        {/* What state the venue is in, said in one line, before anything is
            asked of them. */}
        <div
          className={
            plan.active
              ? "relative overflow-hidden rounded-2xl bg-flex-black px-5 py-5 text-white"
              : "rounded-2xl border-l-[3px] border-red-500 bg-red-50 px-5 py-5"
          }
        >
          {plan.active ? (
            <>
              <p className="font-display text-lg font-semibold">
                {formatDate(venue.planExpiresAt)} gacha
              </p>
              <p className="mt-1 text-sm text-white/55">
                {plan.endingSoon
                  ? `${plan.daysLeft} kun qoldi — muddat tugasa chaqiruv tugmasi o'chadi.`
                  : `${plan.daysLeft} kun qoldi.`}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-semibold">Muddat tugagan</p>
              <p className="mt-1 text-sm text-flex-black/65">
                {w.listTitle} mehmonlarga ochiq — stol ustidagi belgi ishlayveradi. Ammo
                chaqiruv tugmasi va hisobot to&apos;lovgacha yopiq.
              </p>
            </>
          )}
        </div>

        <div className="mt-6">
          <VenuePlanPanel
            handle={normalized}
            points={points}
            monthly={venueMonthly(points)}
            invoices={invoices}
          />
        </div>
      </SubScreen>
    </PageShell>
  );
}
