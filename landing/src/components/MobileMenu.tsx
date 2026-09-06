"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { Link } from "@/i18n/navigation";

export type MenuItem = { href: string; label: string };

// The sections, on a screen too narrow to lay them in a row.
//
// A sheet rather than a full-screen takeover: the page underneath stays
// visible, so it is obvious this closes rather than navigates. It closes on
// Escape and on any link, and while it is open the page behind does not
// scroll — a menu that scrolls the page under it feels broken on a phone.
export default function MobileMenu({
  items,
  openLabel,
  closeLabel,
  children,
}: {
  items: MenuItem[];
  openLabel: string;
  closeLabel: string;
  /** Sits at the foot of the sheet. The language switch, in practice. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    // Restored rather than cleared: a page opened at a scroll position keeps it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-input border border-ink-line text-white transition-colors hover:bg-ink-s1 lg:hidden"
      >
        <Menu className="size-[18px]" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
          />

          <div className="absolute inset-x-3 top-3 rounded-tile border border-line bg-white p-2 shadow-photo">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="cap text-ink-3">{openLabel}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="flex size-9 items-center justify-center rounded-plate text-ink-2 transition-colors hover:bg-fill"
              >
                <X className="size-[18px]" strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex flex-col">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-plate px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-fill"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {children && (
              <div className="mt-2 flex items-center justify-between border-t border-line-soft px-2 pt-3 pb-1">
                {children}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
