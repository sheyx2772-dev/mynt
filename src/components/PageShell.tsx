import Mark from "@/components/Mark";
import Link from "next/link";

// Shared frame: the wordmark linking home, and a measure.
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
//
// There used to be a blurred lime disc bleeding across the top right corner of
// every page in the product. It was the accent used as scenery, which is the
// one thing the accent is not for — and on a guest screen it meant the first
// colour a stranger saw was spent on nothing.
export default function PageShell({
  children,
  wide = false,
  surface = "paper",
  aside,
}: {
  children: React.ReactNode;
  /** A working screen rather than a column of text. */
  wide?: boolean;
  /** Which of the product's faces this page is. */
  surface?: "paper" | "ink";
  /** Sits opposite the wordmark. The number, where a page has one. */
  aside?: React.ReactNode;
}) {
  return (
    <div data-surface={surface} className="relative min-h-full">
      <div
        className={
          wide
            ? "relative mx-auto flex min-h-full max-w-5xl flex-col px-6 py-8 sm:py-12"
            : "relative mx-auto flex min-h-full max-w-md flex-col px-6 py-8 sm:py-16"
        }
      >
        <div className="mb-6 flex h-14 items-center justify-between gap-4 sm:mb-8">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold">
            <Mark />
            FLEX
          </Link>
          {aside}
        </div>
        {children}
      </div>
    </div>
  );
}
