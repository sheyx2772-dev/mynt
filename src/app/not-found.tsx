import Link from "next/link";
import PageShell from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-6xl font-semibold tracking-tight text-mynt-black/15">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          Bunday sahifa yo&apos;q
        </h1>
        <p className="mt-2 text-sm text-mynt-black/60">
          Havolani tekshiring — shaxsiy handle 3 harf va 3 raqamdan (MYN042), MYNT CARD seriyasi
          esa 6 ta raqamdan (000001) iborat bo&apos;ladi.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-lime px-6 py-3 font-medium text-mynt-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
        >
          Bosh sahifaga
        </Link>
      </div>
    </PageShell>
  );
}
