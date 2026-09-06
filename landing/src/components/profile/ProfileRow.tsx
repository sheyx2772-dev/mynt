import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

// One tappable row, and the same one everywhere.
//
// This page is read on a phone held in one hand, usually while its owner is
// standing in front of the reader. So a link is not a word in a paragraph — it
// is a row the width of the screen with a target 56px tall, which is a thumb
// rather than a fingertip. Contacts, links and anything added later use this
// one, because eight rows that are almost the same height is what a profile
// built out of one-off markup looks like.

export default function ProfileRow({
  href,
  external,
  icon,
  label,
  value,
}: {
  href: string;
  /** Opens elsewhere, so it opens beside us rather than instead of us. */
  external?: boolean;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      // A card is passed around; a stranger who taps through to Instagram and
      // presses back has lost the number. http(s) destinations open in their
      // own tab. `tel:` and `mailto:` hand off to another app and never do.
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className="group flex min-h-14 items-center gap-3.5 rounded-input bg-[var(--p-surface)] px-4 py-2.5 transition-colors hover:bg-[var(--p-surface-2)]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-plate bg-[var(--p-surface-2)] text-[var(--p-accent)] [&_svg]:size-4.5">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="cap block text-[var(--p-text-3)]">{label}</span>
        <span className="mt-0.5 block truncate text-[15px] leading-5 font-medium text-[var(--p-text)]">
          {value}
        </span>
      </span>

      <ChevronRight
        aria-hidden
        className="size-4 shrink-0 text-[var(--p-text-3)] transition-transform group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </a>
  );
}
