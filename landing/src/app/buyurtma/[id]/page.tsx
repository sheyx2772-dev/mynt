import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageShell from "@/components/PageShell";
import { requireUser } from "@/lib/auth";
import { getPurchase } from "@/lib/purchase";
import { formatUZS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Buyurtma — flex.com.uz",
  robots: { index: false },
};

// Where a payment provider sends a buyer back to.
//
// The app claims this address as a deep link, so somebody who paid from their
// phone comes back to the app; this page is what everybody else sees, and what
// a phone shows when the link has not been verified. It is deliberately not
// /kabinet: a person who has just paid wants to know about the thing they paid
// for, not to be shown a list.
//
// The status is read fresh on every load and nothing is cached, because the
// confirmation arrives on a provider callback that may land a second after
// this page does.
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: PageProps<"/buyurtma/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/buyurtma/${id}`);

  const order = await getPurchase(id);
  if (!order) notFound();

  return (
    <PageShell>
      <div className="mx-auto max-w-lg px-6 py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-3">Buyurtma</p>
        <h1 className="mt-2 font-display font-semibold text-3xl">{order.handle}</h1>
        <p className="mt-1 text-ink-2">{formatUZS(order.amount)}</p>

        <div className="mt-8 rounded-card border border-flex-black/10 p-6">{status(order)}</div>

        <Link
          href="/kabinet"
          className="mt-6 inline-block text-lime-ink text-sm transition-colors hover:text-flex-black"
        >
          Kabinetga o&apos;tish →
        </Link>
      </div>
    </PageShell>
  );
}

function status(order: Awaited<ReturnType<typeof getPurchase>> & object) {
  if (order.status === "paid" && order.held) {
    return (
      <>
        <p className="font-medium text-flex-black">To&apos;landi.</p>
        <p className="mt-1 text-ink-2 text-sm">
          {order.handle} sizniki. Kabinetda profilini to&apos;ldirishingiz mumkin.
        </p>
      </>
    );
  }

  // Paid, and the number is not theirs. It should no longer be reachable — the
  // handlers refuse to settle an order whose number was lost — but if it ever
  // happens, the person must be told rather than shown a page that implies
  // everything is fine.
  if (order.status === "paid") {
    return (
      <>
        <p className="font-medium text-red-700">To&apos;lov o&apos;tdi, lekin raqam biriktirilmadi.</p>
        <p className="mt-1 text-ink-2 text-sm">
          Bu bo&apos;lmasligi kerak edi. Biz bilan bog&apos;laning — buyurtma raqami{" "}
          <span className="font-mono">{order.id}</span>.
        </p>
      </>
    );
  }

  if (order.status === "pending") {
    return (
      <>
        <p className="font-medium text-flex-black">To&apos;lov kutilmoqda.</p>
        <p className="mt-1 text-ink-2 text-sm">
          Bank tasdig&apos;i bir necha daqiqa olishi mumkin. Sahifani yangilab ko&apos;ring.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="font-medium text-flex-black">Bu buyurtma bekor qilingan.</p>
      <p className="mt-1 text-ink-2 text-sm">
        Raqam yana bo&apos;shadi. Qaytadan urinib ko&apos;rishingiz mumkin.
      </p>
    </>
  );
}
