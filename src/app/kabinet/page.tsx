import Link from "next/link";
import { after } from "next/server";
import type { Metadata } from "next";
import { Pencil, QrCode, Clock } from "lucide-react";
import PageShell from "@/components/PageShell";
import SignOutButton from "@/components/SignOutButton";
import InstallHint from "@/components/InstallHint";
import { requireUser } from "@/lib/auth";
import { listHandlesForUser, touchLastSeen } from "@/lib/handles";
import { formatUZS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kabinet — mynt.uz",
  robots: { index: false },
};

export default async function CabinetPage() {
  const user = await requireUser("/kabinet");
  const handles = await listHandlesForUser(user.id);

  // The cabinet is the one page only an owner loads, which makes it the
  // natural place to stamp activity. Deferred so it never delays the render.
  after(() => touchLastSeen(user.id));

  return (
    <PageShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Kabinet</h1>
          <p className="mt-1 text-sm text-mynt-black/50">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <InstallHint />

      {handles.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-black/15 p-8 text-center">
          <p className="text-sm text-mynt-black/60">
            Hali handle olmagansiz. Bosh sahifadagi hisoblagichda narxni ko&apos;rib, o&apos;zingizga
            mos kombinatsiyani tanlang.
          </p>
          <Link
            href="/#narx"
            className="mt-6 inline-block rounded-full bg-lime px-6 py-3 font-medium text-mynt-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
          >
            Handle tanlash
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {handles.map((h) => (
            <div
              key={h.normalized}
              className="rounded-[1.5rem] border border-black/10 bg-white p-6 shadow-[0_20px_45px_-30px_rgba(14,10,27,0.3)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-semibold tracking-tight">
                    {h.normalized}
                  </p>
                  <p className="font-tabular text-xs text-mynt-black/40">
                    mynt.uz/{h.normalized}
                  </p>
                </div>
                {h.status === "reserved" ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    <Clock className="h-3 w-3" />
                    To&apos;lov kutilmoqda
                  </span>
                ) : (
                  <span className="rounded-full bg-lime/25 px-3 py-1 text-xs font-medium text-mynt-black/70">
                    Sizniki
                  </span>
                )}
              </div>

              {h.pricePaid !== null && (
                <p className="mt-3 font-tabular text-sm text-mynt-black/50">
                  {formatUZS(h.pricePaid)}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/kabinet/${h.normalized}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Tahrirlash
                </Link>
                <Link
                  href={`/kabinet/${h.normalized}#qr`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03]"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  QR-kod
                </Link>
                <Link
                  href={`/${h.normalized}`}
                  className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03]"
                >
                  Ko&apos;rish
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
