import Link from "next/link";
import { Download } from "lucide-react";
import type { Lead } from "@/lib/leads";
import type { PlanId } from "@/lib/plans";
import { timeAgo } from "@/lib/relative-time";

const SOURCE_LABEL: Record<string, string> = {
  nfc: "Tegizib",
  qr: "QR",
  share: "Havoladan",
};

// The contacts sent back, and the way out of the product with them.
//
// The export is not an afterthought: a list you cannot get out of is a list you
// do not trust with anything that matters. It is a link to a route rather than
// a client-side blob so the file is built from the same ownership-filtered read
// as the table.
export default function LeadsPanel({
  handle,
  leads,
  plan,
}: {
  handle: string;
  leads: Lead[];
  plan: PlanId;
}) {
  if (plan === "free") {
    return (
      <section className="rounded-[1.75rem] border border-ink-line bg-ink-s1 p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">Kelgan kontaktlar</h2>
        <p className="mt-1 text-sm text-paper-2">
          Profilingizni ochgan odam o&apos;z ismi va telefonini sizga qoldira oladi.
        </p>
        <div className="mt-6 rounded-2xl border border-ink-line bg-ink-s2 px-5 py-5">
          <p className="text-xs font-medium tracking-[0.14em] text-paper-3 uppercase">
            Premium
          </p>
          <p className="mt-2 text-sm text-paper-2">
            Karta ikki tomonlama bo&apos;ladi: siz o&apos;z ma&apos;lumotingizni
            berasiz, ular o&apos;zinikini qoldiradi. Tadbirdan keyin qo&apos;lingizda
            tayyor ro&apos;yxat bo&apos;ladi &mdash; Excel&apos;ga ham chiqariladi.
          </p>
          <Link
            href="/tarif"
            className="mt-4 inline-block rounded-xl bg-ink-s2 px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-paper uppercase transition-opacity hover:opacity-90"
          >
            Tariflar
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-ink-line bg-ink-s1 p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Kelgan kontaktlar
          </h2>
          <p className="mt-1 text-sm text-paper-2">
            {leads.length > 0
              ? `${leads.length} ta`
              : "Profilingizni ochgan odam ismi va telefonini shu yerga qoldiradi."}
          </p>
        </div>

        {leads.length > 0 && (
          <a
            href={`/kabinet/${handle}/kontaktlar.csv`}
            className="flex items-center gap-1.5 rounded-xl border border-ink-line px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-ink-s2"
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </a>
        )}
      </div>

      {leads.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-line px-4 py-6 text-center text-sm text-paper-3">
          Hali hech kim kontakt qoldirmagan.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-ink-line">
          {leads.map((lead) => (
            <li key={lead.id} className="py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{lead.name}</p>
                <p className="font-tabular text-xs text-paper-3">
                  {timeAgo(lead.createdAt)}
                  {lead.source && ` · ${SOURCE_LABEL[lead.source] ?? lead.source}`}
                </p>
              </div>

              {lead.company && (
                <p className="mt-0.5 text-sm text-paper-2">{lead.company}</p>
              )}

              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-tabular text-sm">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone.replace(/[^0-9+]/g, "")}`}
                    className="text-paper-2 underline-offset-2 hover:underline"
                  >
                    {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-paper-2 underline-offset-2 hover:underline"
                  >
                    {lead.email}
                  </a>
                )}
              </div>

              {lead.note && (
                <p className="mt-1.5 text-sm break-words whitespace-pre-wrap text-paper-2">
                  {lead.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
