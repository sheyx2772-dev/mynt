import Mark from "@/components/Mark";
import Link from "next/link";

// Shared frame: dot grid, lime glow, and the wordmark linking home.
//
// Two widths, because two kinds of page live here. A profile or a sign-in form
// is a column and stays one — max-w-md is the right measure for reading and the
// wrong one for working. The screens somebody keeps open — a contact list, a
// queue of parcels — are the other kind, and on a laptop they were being
// squeezed into a phone's width in the middle of a very empty desk.
//
// The queue asked for max-w-4xl and never got it: nested inside this, an inner
// max-w-4xl cannot exceed the max-w-md around it. It had been 448px wide on a
// 1440px screen since it was written.
export default function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  /** A working screen rather than a column of text. */
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="absolute -top-24 right-[-4rem] h-72 w-72 rounded-full bg-lime/20 blur-[90px]" />
      <div
        className={
          wide
            ? "relative mx-auto flex min-h-full max-w-5xl flex-col px-6 py-8 sm:py-12"
            : "relative mx-auto flex min-h-full max-w-md flex-col px-6 py-8 sm:py-16"
        }
      >
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
