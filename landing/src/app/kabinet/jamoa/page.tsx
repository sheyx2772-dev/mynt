import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import ReleaseHandleButton from "@/components/ReleaseHandleButton";
import AssignHandleForm from "@/components/AssignHandleForm";
import { requireUser } from "@/lib/auth";
import { getTeamForUser, listTeamHandles, getTeamStats } from "@/lib/teams";
import { TEAM_SEAT_MONTHLY, MIN_TEAM_SEATS } from "@/lib/plans";
import { formatUZS } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import InvoiceRequest from "@/components/InvoiceRequest";
import { listInvoices } from "@/lib/invoices";

export const metadata: Metadata = {
  title: "Firma — flex.com.uz",
  robots: { index: false },
};

export default async function JamoaPage() {
  const user = await requireUser("/kabinet/jamoa");
  const team = await getTeamForUser(user.id);

  // Nothing is self-serve yet: a company account is opened by us, because the
  // seats, the numbers and the physical cards are ordered together and one of
  // those is a factory run. Saying so beats an empty dashboard.
  if (!team) {
    return (
      <PageShell surface="ink">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Firma hisobi</h1>
        <p className="mt-3 max-w-prose text-paper-2">
          Xodimlaringizga bir blokdan raqam va karta chiqaring, bitta hisobdan
          boshqaring.
        </p>

        <div className="mt-8 space-y-3 text-sm text-paper-2">
          <p>
            <span className="font-medium">Bir o&apos;rin — {formatUZS(TEAM_SEAT_MONTHLY)} / oy.</span>{" "}
            Eng kami {MIN_TEAM_SEATS} o&apos;rin. To&apos;lov firmadan, bitta
            hisob-fakturada.
          </p>
          <p>
            <span className="font-medium">O&apos;rin sotib olinadi, odam emas.</span>{" "}
            Xodim ishdan chiqsa o&apos;rin bo&apos;shaydi va keyingisiga beriladi.
          </p>
          <p>
            <span className="font-medium">Raqam firmaniki.</span> Xodim ketganda
            uning ismi, surati, telefoni va havolalari o&apos;chadi; raqam va karta
            firmada qoladi va keyingi xodimga beriladi.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-ink-line bg-ink-s2 px-6 py-5">
          <p className="text-sm text-paper-2">
            Firma hisobini biz ochamiz — o&apos;rinlar soni, raqamlar bloki va
            kartalar bitta buyurtmada tayyorlanadi.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`tel:${COMPANY.phoneHref}`}
              className="rounded-xl bg-ink-s2 px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-paper uppercase"
            >
              {COMPANY.phone}
            </a>
            <Link
              href="/biznes#jamoa"
              className="rounded-xl border border-ink-line px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors hover:bg-ink-s2"
            >
              So&apos;rov qoldirish
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const [handles, invoices, stats] = await Promise.all([
    listTeamHandles(team.id),
    listInvoices(team.id),
    getTeamStats(team.id),
  ]);
  const taken = handles.filter((h) => h.userId).length;

  return (
    <PageShell surface="ink">
      <p className="text-[11px] font-medium tracking-[0.18em] text-paper-3 uppercase">
        Firma
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{team.name}</h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-ink-line bg-ink-s2 px-4 py-3">
          <p className="font-display text-2xl font-semibold tabular-nums">{taken}</p>
          <p className="mt-0.5 text-xs text-paper-3">Band</p>
        </div>
        <div className="rounded-2xl border border-ink-line bg-ink-s2 px-4 py-3">
          <p className="font-display text-2xl font-semibold tabular-nums">
            {Math.max(0, team.seats - taken)}
          </p>
          <p className="mt-0.5 text-xs text-paper-3">Bo&apos;sh o&apos;rin</p>
        </div>
        <div className="rounded-2xl border border-ink-line bg-ink-s2 px-4 py-3">
          <p className="font-display text-2xl font-semibold tabular-nums">{team.seats}</p>
          <p className="mt-0.5 text-xs text-paper-3">Jami</p>
        </div>
      </div>

      <section className="mt-8 rounded-[1.75rem] border border-ink-line bg-ink-s1 p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Jamoa bo&apos;yicha
        </h2>
        <p className="mt-1 text-sm text-paper-2">
          Barcha raqamlar bo&apos;yicha jami.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-ink-line bg-ink-s2 px-4 py-3">
            <p className="font-display text-2xl font-semibold tabular-nums">{stats.views}</p>
            <p className="mt-0.5 text-xs text-paper-3">Profil ochilgan</p>
          </div>
          <div className="rounded-2xl border border-ink-line bg-ink-s2 px-4 py-3">
            <p className="font-display text-2xl font-semibold tabular-nums">{stats.leads}</p>
            <p className="mt-0.5 text-xs text-paper-3">Kelgan kontakt</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-ink-line bg-ink-s1 p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">Raqamlar</h2>

        {handles.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-ink-line px-4 py-6 text-center text-sm text-paper-3">
            Bu firmaga hali raqam biriktirilmagan.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-ink-line">
            {handles.map((h) => (
              <li key={h.normalized} className="flex flex-wrap items-center gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${h.normalized}`}
                    className="font-tabular text-sm font-medium underline-offset-2 hover:underline"
                  >
                    {h.normalized}
                  </Link>
                  {/* Three states, not two: nobody has it, somebody has it and
                      has not filled it in yet, and somebody has it. The middle
                      one read as "nobody has it" beside a Release button. */}
                  <p className="mt-0.5 text-sm text-paper-2">
                    {h.userId
                      ? (h.holderName ?? "Biriktirilgan — profil hali to'ldirilmagan")
                      : "Bo'sh — hech kimda emas"}
                    {h.userId && h.position && ` · ${h.position}`}
                  </p>
                </div>

                <p className="font-tabular text-xs text-paper-3">{h.viewCount}</p>

                {h.userId ? (
                  <ReleaseHandleButton handle={h.normalized} holderName={h.holderName} />
                ) : (
                  <AssignHandleForm handle={h.normalized} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-ink-line bg-ink-s1 p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">To&apos;lov</h2>
        <p className="mt-1 mb-5 text-sm text-paper-2">
          Firma to&apos;lovi bank o&apos;tkazmasi orqali. Hisob-fakturani
          o&apos;zingiz olasiz, buxgalteriyangizga berasiz.
        </p>

        <InvoiceRequest currentSeats={team.seats} />

        {invoices.length > 0 && (
          <ul className="mt-6 divide-y divide-ink-line">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link
                  href={`/kabinet/jamoa/hisob/${inv.id}`}
                  className="font-tabular text-sm font-medium underline-offset-2 hover:underline"
                >
                  №{inv.number}
                </Link>
                <span className="text-sm text-paper-2">
                  {inv.seats} o&apos;rin · {inv.months} oy
                </span>
                <span className="ml-auto font-tabular text-sm">{formatUZS(inv.total)}</span>
                <span
                  className={
                    inv.status === "paid"
                      ? "rounded-lg bg-lime/25 px-2.5 py-1 text-xs font-medium"
                      : "rounded-lg border border-ink-line px-2.5 py-1 text-xs text-paper-2"
                  }
                >
                  {inv.status === "paid" ? "To'langan" : "Kutilmoqda"}
                </span>
                <span className="w-full font-tabular text-xs text-paper-3">
                  {inv.issuedAt.slice(0, 10).split("-").reverse().join(".")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-sm text-paper-3">
        Raqam biriktirish yoki rekvizitlarni o&apos;zgartirish uchun biz bilan
        bog&apos;laning: {COMPANY.phone}
      </p>
    </PageShell>
  );
}
