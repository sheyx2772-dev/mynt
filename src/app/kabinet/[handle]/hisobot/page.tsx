import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BellRing, ReceiptText, Sparkles, Star } from "lucide-react";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue } from "@/lib/menu";
import { listRequestsSince } from "@/lib/venue-requests";
import { summariseRequests, formatWait } from "@/lib/venue-report";
import { venueWords } from "@/lib/venue-words";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Hisobot — flex.com.uz", robots: { index: false } };

// How the room did, as opposed to what it wants right now.
//
// Every number here is drawn from rows the requests already write, and the one
// the owner will look at first is how long a table waited — which is why
// done_at is stored at all.

const DAYS = 30;

export default async function ReportPage({ params }: PageProps<"/kabinet/[handle]/hisobot">) {
  const { handle } = await params;
  const { normalized, userId } = await requireOwnHandle(handle, "/kabinet/[handle]/hisobot");

  const venue = await getOwnedVenue(normalized, userId);
  if (!venue) notFound();

  const w = venueWords(venue.kind, "uz");
  const { rows, capped } = await listRequestsSince(venue.id, DAYS);
  const report = summariseRequests(rows);

  const peakHour = Math.max(...report.byHour);
  const busiest = report.points[0]?.count ?? 0;

  return (
    <PageShell>
      <SubScreen
        handle={normalized}
        title="Hisobot"
        hint={`${venue.name} — so'nggi ${DAYS} kun.`}
      >
        {report.total === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 px-6 py-12 text-center">
            <p className="text-sm text-flex-black/50">
              Hali so&apos;rov kelmagan. {w.pointsTitle} belgilanib, kodlar
              qo&apos;yilgach shu yerda ko&apos;rinadi.
            </p>
            <Link
              href={`/kabinet/${normalized}/nuqtalar`}
              className="mt-5 inline-block rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/[0.03]"
            >
              {w.pointsTitle}
            </Link>
          </div>
        ) : (
          <>
            {/* The two numbers worth a glance: how many, and how fast. */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="grain relative overflow-hidden rounded-2xl bg-flex-black px-5 py-5 text-white">
                <p className="font-display font-tabular text-3xl font-semibold">
                  {formatNumber(report.total)}
                </p>
                <p className="mt-1 text-xs tracking-widest text-white/40 uppercase">
                  So&apos;rov
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white px-5 py-5">
                <p className="font-display font-tabular text-3xl font-semibold">
                  {formatWait(report.medianWait)}
                </p>
                <p className="mt-1 text-xs tracking-widest text-flex-black/40 uppercase">
                  O&apos;rtacha javob
                </p>
              </div>
            </div>

            {/* The worst one is the number that changes behaviour: an owner who
                learns a table waited forty minutes goes and asks why. */}
            {report.worstWait !== null && (
              <p className="mt-2.5 rounded-2xl border border-black/10 bg-white px-5 py-3.5 text-sm text-flex-black/60">
                Eng uzoq kutish — <strong className="font-medium text-flex-black">
                  {formatWait(report.worstWait)}
                </strong>
                . {report.waiting > 0 && `Hozir ${report.waiting} ta ochiq.`}
              </p>
            )}

            <section className="mt-8">
              <h2 className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                Nima so&apos;ralgan
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Kind icon={<BellRing className="h-4 w-4" />} label="Chaqiruv" value={report.byKind.waiter} />
                <Kind icon={<ReceiptText className="h-4 w-4" />} label="Hisob" value={report.byKind.bill} />
                <Kind icon={<Sparkles className="h-4 w-4" />} label="Tozalash" value={report.byKind.clean} />
                <Kind icon={<Star className="h-4 w-4" />} label="Izoh" value={report.byKind.review} />
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-1 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                Qaysi {w.pointPrefix.toLowerCase()}dan
              </h2>
              <p className="mb-3 text-sm text-flex-black/50">
                Ko&apos;p chaqirgani yuqorida.
              </p>

              <div className="divide-y divide-black/6 rounded-2xl border border-black/10 bg-white">
                {report.points.slice(0, 12).map((entry) => (
                  <div key={entry.point} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-16 shrink-0 font-tabular text-sm font-semibold">
                      {entry.point}
                    </span>
                    {/* The bar is the comparison; the number is the fact. */}
                    <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                      <span
                        className="block h-full rounded-full bg-lime-ink"
                        style={{ width: `${Math.max(4, (entry.count / busiest) * 100)}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right font-tabular text-sm text-flex-black/60">
                      {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-1 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                Qaysi soatlarda
              </h2>
              <p className="mb-4 text-sm text-flex-black/50">
                Toshkent vaqti bilan.
              </p>

              <div className="flex h-28 items-end gap-[3px]">
                {report.byHour.map((count, hour) => (
                  <div
                    key={hour}
                    title={`${hour}:00 — ${count}`}
                    className="flex-1 rounded-t-sm bg-lime-ink/80"
                    style={{ height: `${peakHour > 0 ? Math.max(2, (count / peakHour) * 100) : 2}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between font-tabular text-[10px] text-flex-black/35">
                <span>00</span>
                <span>06</span>
                <span>12</span>
                <span>18</span>
                <span>23</span>
              </div>
            </section>

            {report.reviews.count > 0 && (
              <section className="mt-8 rounded-2xl border border-black/10 bg-white px-5 py-5">
                <div className="flex items-baseline gap-3">
                  <p className="font-display font-tabular text-3xl font-semibold">
                    {report.reviews.average}
                  </p>
                  <p className="text-sm text-flex-black/50">
                    {report.reviews.count} ta izoh bo&apos;yicha
                  </p>
                </div>
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={
                        n <= Math.round(report.reviews.average ?? 0)
                          ? "h-4 w-4 fill-lime-ink text-lime-ink"
                          : "h-4 w-4 text-black/15"
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {capped && (
              <p className="mt-6 text-xs text-flex-black/40">
                So&apos;rov juda ko&apos;p — eng so&apos;nggilari hisobga olindi.
              </p>
            )}
          </>
        )}
      </SubScreen>
    </PageShell>
  );
}

function Kind({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
      <span className="text-flex-black/40">{icon}</span>
      <p className="mt-2 font-display font-tabular text-xl font-semibold">
        {formatNumber(value)}
      </p>
      <p className="mt-0.5 text-xs text-flex-black/45">{label}</p>
    </div>
  );
}
