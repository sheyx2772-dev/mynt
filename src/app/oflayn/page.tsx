import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Internet yo'q — flex.uz",
  robots: { index: false },
};

// Precached by the service worker and shown when a navigation cannot reach
// the network. Kept static and dependency-free so it is always available.
export default function OfflinePage() {
  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04]">
          <WifiOff className="h-6 w-6 text-flex-black/40" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          Internet yo&apos;q
        </h1>
        <p className="mt-2 text-sm text-flex-black/60">
          Ulanishni tekshirib, qaytadan urinib ko&apos;ring. Profil sahifalari doim eng so&apos;nggi
          holatda ko&apos;rsatilishi uchun ular oflayn saqlanmaydi.
        </p>
      </div>
    </PageShell>
  );
}
