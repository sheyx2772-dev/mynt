"use client";

import { useParams } from "next/navigation";
import { Check, ChevronDown, Clock } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";

// The plate in the middle of the bar: which number, and the others.
//
// Which one is open is read from the address rather than passed down, because
// the bar sits in a layout above `[handle]` and a layout cannot see its
// children's params. `/cabinet` itself opens the oldest number, which is the
// same rule the page applies; the orders screen is the account's and shows no
// plate at all, so a person does not read a number over a list that is not
// about it.
//
// One number is a plate you can press to go home. Several are the same plate
// with a chevron, and the list opens under the thumb — a company holding
// twelve for its staff switches between them without leaving the screen.
export type SwitchHandle = { raqam: string; reserved: boolean };

const plateClass =
  "flex h-11 items-center gap-1.5 rounded-input px-3.5 font-mono text-sm font-semibold tracking-[0.16em] text-foreground transition-colors hover:bg-muted";

export default function NumberSwitch({
  handles,
  label,
}: {
  handles: SwitchHandle[];
  label: string;
}) {
  const { handle } = useParams<{ handle?: string }>();
  const pathname = usePathname();

  const current = handle
    ? (handles.find((h) => h.raqam === handle.toUpperCase()) ?? null)
    : pathname === "/cabinet"
      ? (handles[0] ?? null)
      : null;

  if (!current) return <span className="flex-1" />;

  if (handles.length < 2) {
    return (
      <Link
        href={`/cabinet/${current.raqam}`}
        aria-current="page"
        className={plateClass}
      >
        {current.raqam}
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={label} className={plateClass}>
        {current.raqam}
        <ChevronDown
          aria-hidden
          className="size-4 opacity-70"
          strokeWidth={2}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-48 rounded-card">
        <DropdownMenuLabel className="cap text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {handles.map((h) => (
          <DropdownMenuItem
            key={h.raqam}
            asChild
            className="h-11 rounded-plate font-mono text-sm font-medium tracking-[0.14em]"
          >
            <Link href={`/cabinet/${h.raqam}`}>
              <span className="flex-1">{h.raqam}</span>
              {h.reserved && (
                <Clock
                  aria-hidden
                  className="size-4 text-muted-foreground"
                  strokeWidth={2}
                />
              )}
              {h.raqam === current.raqam && (
                <Check aria-hidden className="size-4" strokeWidth={2.5} />
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
