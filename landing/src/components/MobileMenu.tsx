"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";

// The phone's way into everything the desktop header lists in a row.
//
// On a phone that row had nowhere to go: the nav was `hidden lg:flex`, so
// Narxlash, Shaxsiy, Biznes and Savollar were unreachable unless you happened
// to scroll onto them. UNQX puts the same list behind three lines at the top,
// which is the convention, and it is the right one here — the sections exist,
// they just should not all be on the entry screen.
//
// The panel is portalled to the body rather than rendered where it sits. The
// header carries `backdrop-blur`, and a backdrop filter makes its element the
// containing block for fixed-position descendants — so `fixed inset-0` meant
// the header's own box, and the panel painted itself into the bar instead of
// over the page. Found by opening it, not by reading the classes.

export type MenuItem = { href: string; label: string };

export default function MobileMenu({
  items,
  cta,
  closeLabel,
  openLabel,
  children,
}: {
  items: MenuItem[];
  cta: MenuItem;
  openLabel: string;
  closeLabel: string;
  /** The language switch, which has no room left in the bar itself. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // The panel covers the page, so the page behind it must not scroll under it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes it, the same as the button. A panel with no keyboard way out
  // is a trap on the desktop widths this still renders at while resizing.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        aria-expanded={open}
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 lg:hidden"
      >
        <Menu className="h-6 w-6" strokeWidth={1.9} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-flex-black text-white lg:hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <span className="font-display text-xl font-semibold tracking-tight">
                flex
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="-mr-1 flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/10"
              >
                <X className="h-6 w-6" strokeWidth={1.9} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
              <ul className="divide-y divide-white/10 border-y border-white/10">
                {items.map((item) => (
                  <li key={item.href}>
                    {item.href.startsWith("#") ? (
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block py-4 font-display text-xl font-medium tracking-tight"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block py-4 font-display text-xl font-medium tracking-tight"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              <a
                href={cta.href}
                onClick={() => setOpen(false)}
                className="mt-8 block rounded-full bg-lime px-6 py-4 text-center font-medium text-flex-black"
              >
                {cta.label}
              </a>

              {children && (
                <div className="mt-8 flex justify-center">{children}</div>
              )}
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
