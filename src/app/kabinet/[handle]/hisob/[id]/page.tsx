import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireOwnHandle } from "@/lib/kabinet";
import { getOwnedVenue } from "@/lib/menu";
import { getVenueInvoice, venueInvoiceTotal } from "@/lib/venue-billing";
import { venueWords } from "@/lib/venue-words";
import { COMPANY, VAT } from "@/lib/company";
import { formatUZS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Hisob-faktura — flex.com.uz",
  robots: { index: false },
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1">
      <span className="w-40 shrink-0 text-black/45">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/**
 * The document a cafe takes to its bank.
 *
 * Deliberately outside the site's own styling, exactly as the company invoice
 * is: printed, filed and stamped, so it is black on white at a paper width and
 * carries nothing that only makes sense on a screen.
 *
 * The buyer's side is left blank rather than filled with the venue's trading
 * name. A cafe called "Choyxona Navro'z" is almost never what the bank calls
 * it, and an invoice carrying a name that does not match the account is one the
 * accountant sends back — a blank line they complete is more honest than a
 * guess of ours.
 */
export default async function VenueInvoicePage(
  props: PageProps<"/kabinet/[handle]/hisob/[id]">,
) {
  const { handle, id } = await props.params;
  const { normalized, userId } = await requireOwnHandle(
    handle,
    "/kabinet/[handle]/hisob/[id]",
  );

  const venue = await getOwnedVenue(normalized, userId);
  if (!venue) notFound();

  const invoice = await getVenueInvoice(venue.id, id);
  if (!invoice) notFound();

  const w = venueWords(venue.kind, "uz");
  const { net, vat } = venueInvoiceTotal(
    invoice.points,
    invoice.months,
    invoice.monthly,
    invoice.vatPercent,
  );

  const issued = invoice.issuedAt.slice(0, 10).split("-").reverse().join(".");

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-[13px] leading-relaxed text-black sm:p-12">
      {/* A document, not one of our screens: the app bar has nowhere to go
          from here and would print. */}
      <span data-no-app-bar hidden />
      <style>{`@media print { @page { margin: 16mm; } .no-print { display: none } }`}</style>

      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl font-bold">{invoice.number}-son hisob-faktura</h1>
          <p className="mt-0.5 text-black/55">{issued} sanadan</p>
        </div>
        <p className="text-right text-black/55">
          {invoice.status === "paid" ? "To'langan" : "To'lov kutilmoqda"}
        </p>
      </header>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-bold uppercase">Yetkazib beruvchi</h2>
          <Field label="Nomi" value={COMPANY.legalName} />
          <Field label="INN" value={COMPANY.inn} />
          <Field label="Manzil" value={COMPANY.address} />
          <Field label="Bank" value={COMPANY.bank} />
          <Field label="Hisob raqami" value={COMPANY.account} />
          <Field label="MFO" value={COMPANY.mfo} />
        </div>

        <div>
          <h2 className="mb-2 font-bold uppercase">Xaridor</h2>
          <Field label="Obyekt" value={`${venue.name} · ${normalized}`} />
          <Field label="Nomi" value=" " />
          <Field label="INN" value=" " />
          <Field label="Manzil" value={venue.address ?? " "} />
          <Field label="Bank" value=" " />
          <Field label="Hisob raqami" value=" " />
          <Field label="MFO" value=" " />
        </div>
      </section>

      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="py-2 font-bold">Xizmat</th>
            <th className="py-2 text-right font-bold">Miqdori</th>
            <th className="py-2 text-right font-bold">Narxi</th>
            <th className="py-2 text-right font-bold">Summa</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black/15">
            <td className="py-2.5">
              Flex — obyekt obunasi ({venue.name})
              <span className="block text-black/50">
                {invoice.points} ta {w.pointPrefix.toLowerCase()}, {invoice.months} oy
              </span>
            </td>
            <td className="py-2.5 text-right tabular-nums">{invoice.months} oy</td>
            <td className="py-2.5 text-right tabular-nums">{formatUZS(invoice.monthly)}</td>
            <td className="py-2.5 text-right font-medium tabular-nums">{formatUZS(net)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 ml-auto max-w-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-black/55">Summa</span>
          <span className="tabular-nums">{formatUZS(net)}</span>
        </div>
        {/* Printed either way. An invoice that simply omits the line leaves the
            buyer's accountant guessing whether it was zero or forgotten. */}
        <div className="flex justify-between">
          <span className="text-black/55">
            QQS{invoice.vatPercent > 0 ? ` (${invoice.vatPercent}%)` : " qo'llanilmaydi"}
          </span>
          <span className="tabular-nums">{formatUZS(vat)}</span>
        </div>
        <div className="flex justify-between border-t border-black pt-1.5 text-base font-bold">
          <span>Jami</span>
          <span className="tabular-nums">{formatUZS(invoice.total)}</span>
        </div>
        {invoice.vatPercent === 0 && VAT.exemptionNote && (
          <p className="pt-1 text-right text-black/50">{VAT.exemptionNote}</p>
        )}
      </div>

      <p className="mt-8 text-black/55">
        To&apos;lov maqsadida {invoice.number}-son hisob-fakturani ko&apos;rsating.
        To&apos;lov kelgach {venue.name} obunasi {invoice.months} oyga uzaytiriladi.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-black/55">Yetkazib beruvchi</p>
          <div className="mt-8 border-t border-black pt-1.5">
            <p className="font-medium">{COMPANY.contactPerson}</p>
            <p className="text-black/50">{COMPANY.phone}</p>
          </div>
        </div>
        <div>
          <p className="text-black/55">Xaridor</p>
          <div className="mt-8 border-t border-black pt-1.5">
            <p className="font-medium">&nbsp;</p>
            <p className="text-black/50">{venue.name}</p>
          </div>
        </div>
      </div>

      <div className="no-print mt-8">
        <a
          href={`/kabinet/${normalized}/obuna`}
          className="text-black/50 underline underline-offset-2"
        >
          Obunaga qaytish
        </a>
      </div>
    </main>
  );
}
