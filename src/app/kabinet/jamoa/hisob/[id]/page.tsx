import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTeamForUser } from "@/lib/teams";
import { getInvoice, getBuyerRequisites, invoiceTotal } from "@/lib/invoices";
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
 * The document a company takes to its bank.
 *
 * Deliberately outside the site's own styling: it is printed, filed and stamped,
 * so it is black on white at a paper width and carries nothing that only makes
 * sense on a screen. The print rules drop the surrounding chrome rather than
 * asking anyone to fiddle with browser settings.
 */
export default async function InvoicePage(props: PageProps<"/kabinet/jamoa/hisob/[id]">) {
  const { id } = await props.params;
  const user = await requireUser("/kabinet/jamoa");

  const team = await getTeamForUser(user.id);
  if (!team) notFound();

  const invoice = await getInvoice(id, team.id);
  if (!invoice) notFound();

  const buyer = await getBuyerRequisites(team.id);
  const { net, vat } = invoiceTotal(
    invoice.seats,
    invoice.months,
    invoice.seatMonthly,
    invoice.vatPercent,
  );

  const issued = invoice.issuedAt.slice(0, 10).split("-").reverse().join(".");

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-[13px] leading-relaxed text-black sm:p-12">
      <style>{`@media print { @page { margin: 16mm; } .no-print { display: none } }`}</style>

      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl font-bold">
            {invoice.number}-son hisob-faktura
          </h1>
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
          <Field label="Nomi" value={buyer?.legalName ?? team.name} />
          <Field label="INN" value={buyer?.inn ?? "—"} />
          <Field label="Manzil" value={buyer?.address ?? "—"} />
          <Field label="Bank" value={buyer?.bankName ?? "—"} />
          <Field label="Hisob raqami" value={buyer?.bankAccount ?? "—"} />
          <Field label="MFO" value={buyer?.bankMfo ?? "—"} />
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
              Flex raqamli vizitka — firma obunasi
              <span className="block text-black/50">
                {invoice.months} oy, bir o&apos;ringa {formatUZS(invoice.seatMonthly)}/oy
              </span>
            </td>
            <td className="py-2.5 text-right tabular-nums">
              {invoice.seats} × {invoice.months}
            </td>
            <td className="py-2.5 text-right tabular-nums">
              {formatUZS(invoice.seatMonthly)}
            </td>
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
        To&apos;lov kelgach obuna {invoice.months} oyga uzaytiriladi va o&apos;rinlar
        soni {invoice.seats} taga yetkaziladi.
      </p>

      {/* Both signature lines, because that is what the document is expected to
          carry here and an invoice without them comes back from the buyer's
          accountant. */}
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
            <p className="font-medium">{buyer?.director ?? "\u00A0"}</p>
            <p className="text-black/50">{buyer?.legalName ?? team.name}</p>
          </div>
        </div>
      </div>

      <div className="no-print mt-8">
        <a
          href={`/kabinet/jamoa`}
          className="text-black/50 underline underline-offset-2"
        >
          Firma paneliga qaytish
        </a>
      </div>
    </main>
  );
}
