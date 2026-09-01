import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { PLANS, yearlyMonthsFree } from "@/lib/plans";
import { formatUZS } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import { getUser } from "@/lib/auth";
import { listHandlesForUser } from "@/lib/handles";
import SubscribeButton from "@/components/SubscribeButton";

export const metadata: Metadata = {
  title: "Tariflar — flex.com.uz",
  description:
    "Oddiy reja raqam narxiga kiritilgan. Premium — to'liq statistika, cheksiz havolalar va oltin profil.",
};

// The plans had been described in the terms page and nowhere a buyer would
// look. A subscription with no page to read is a subscription nobody buys.
export default async function TarifPage() {
  const free = PLANS.find((p) => p.id === "free")!;
  const premium = PLANS.find((p) => p.id === "premium")!;

  // Signed out, the page is a price list; signed in, it is a checkout. Nothing
  // about the plans is hidden either way.
  const user = await getUser();
  const owned = user ? await listHandlesForUser(user.id) : [];
  const handles = owned
    .filter((h) => h.status === "claimed")
    .map((h) => ({ normalized: h.normalized, premium: h.plan === "premium" }));

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Tariflar</h1>
      <p className="mt-3 max-w-prose text-flex-black/60">
        Raqam bir marta sotib olinadi va sizniki bo&apos;lib qoladi. Profilni ochiq
        tutish esa har oy turadigan xarajat, shuning uchun u alohida to&apos;lanadi.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {[free, premium].map((p) => (
          <div
            key={p.id}
            className={
              p.id === "premium"
                ? "rounded-2xl border border-black/12 bg-flex-black p-7 text-white shadow-[0_30px_60px_-30px_rgba(14,10,27,0.5)]"
                : "rounded-2xl border border-black/10 bg-white p-7"
            }
          >
            <p
              className={
                p.id === "premium"
                  ? "text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase"
                  : "text-[11px] font-medium tracking-[0.18em] text-flex-black/40 uppercase"
              }
            >
              {p.name}
            </p>

            <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
              {p.monthly === 0 ? p.tagline : `${formatUZS(p.monthly)} / oy`}
            </p>

            {p.yearly > 0 && (
              <p className="mt-1 text-sm text-white/45">
                Yiliga {formatUZS(p.yearly)} — {yearlyMonthsFree()} oy tekin
              </p>
            )}

            {p.id === "premium" && user && (
              <SubscribeButton handles={handles} period="yearly" />
            )}

            <ul
              className={
                p.id === "premium"
                  ? "mt-6 space-y-2 text-sm text-white/70"
                  : "mt-6 space-y-2 text-sm text-flex-black/65"
              }
            >
              {p.includes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Automatic recurring billing is not built. Saying so is better than a
          button that takes money and cannot renew or cancel. */}
      <div className="mt-8 rounded-2xl border border-black/10 bg-black/[0.02] px-6 py-5">
        <p className="text-sm text-flex-black/70">
          Premiumni hozircha bevosita ulaymiz — avtomatik oylik to&apos;lov hali
          ishlamayapti va bo&apos;lmagan narsani tugma qilib qo&apos;ymaymiz.
          Yozing yoki qo&apos;ng&apos;iroq qiling, bir kun ichida yoqamiz.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`tel:${COMPANY.phoneHref}`}
            className="rounded-xl bg-flex-black px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-white uppercase transition-opacity hover:opacity-90"
          >
            {COMPANY.phone}
          </a>
          <a
            href={`mailto:${COMPANY.email}`}
            className="rounded-xl border border-black/12 px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors hover:bg-black/[0.03]"
          >
            {COMPANY.email}
          </a>
        </div>
      </div>

      <p className="mt-6 text-sm text-flex-black/45">
        Obuna tugasa profil o&apos;chmaydi — raqam to&apos;langan va ochiq qoladi,
        faqat premium imkoniyatlari to&apos;xtaydi.{" "}
        <Link href="/shartlar" className="underline underline-offset-2">
          Ommaviy oferta
        </Link>
      </p>
    </PageShell>
  );
}
