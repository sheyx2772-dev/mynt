import Mark from "@/components/Mark";
import Link from "next/link";

// Shared frame for the narrow, single-column pages (profile, card, sign-in):
// dot grid, lime glow, and the wordmark linking home.
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_45%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-24 right-[-4rem] h-72 w-72 rounded-full bg-lime/20 blur-[90px]" />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col px-6 py-8 sm:py-16">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 self-start font-display text-lg font-semibold sm:mb-10"
        >
          <Mark />
          flex
        </Link>
        {children}
      </div>
    </div>
  );
}
