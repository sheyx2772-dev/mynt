import type { Metadata } from "next";
import { Download } from "lucide-react";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import { requireOwnHandle } from "@/lib/kabinet";

export const metadata: Metadata = { title: "QR-kod — flex.com.uz", robots: { index: false } };

// Held up across a table, so it is the whole screen rather than a panel at the
// bottom of one. The SVG is the same file the card is printed from.
export default async function QrPage({ params }: PageProps<"/kabinet/[handle]/qr">) {
  const { handle } = await params;
  const { normalized } = await requireOwnHandle(handle, "/kabinet/[handle]/qr");

  return (
    <PageShell surface="ink">
      <SubScreen
        handle={normalized}
        title="QR-kod"
        hint="NFC ishlamaydigan telefonlar uchun zaxira. Kartaga bosish uchun ham shu kod."
      >
        <div className="rounded-[1.75rem] border border-ink-line bg-ink-s1 p-7 text-center shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
          <div className="mx-auto w-64 max-w-full rounded-2xl border border-ink-line p-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- an SVG route, not an optimizable asset */}
            <img
              src={`/${normalized}/qr`}
              alt={`${normalized} uchun QR-kod`}
              className="h-full w-full"
            />
          </div>

          <p className="mt-5 font-tabular text-sm text-paper-3">
            flex.com.uz/{normalized}
          </p>

          <a
            href={`/${normalized}/qr`}
            download={`${normalized}-qr.svg`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-ink-line px-5 py-2.5 text-sm font-medium transition-colors hover:bg-ink-s2"
          >
            <Download className="h-3.5 w-3.5" />
            SVG yuklab olish
          </a>
        </div>
      </SubScreen>
    </PageShell>
  );
}
