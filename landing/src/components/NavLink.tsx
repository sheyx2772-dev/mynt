"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

/**
 * A header link that knows whether the thing it names is already on screen.
 *
 * Some of these name a page and some name a section of the entry page, and
 * which one is true depends on where the reader is standing. Pressing "Narxlar"
 * on the entry page and being sent to a page whose first screen is the block
 * you were already looking at is a navigation that undoes itself; pressing it
 * from a device page has to go somewhere, because there is no price block there
 * to scroll to.
 *
 * So the link carries both, and picks. `anchor` is used only when the reader is
 * on the page that has it. The `href` is what is rendered into the HTML for
 * every other case, which is also what a crawler and a middle-click get — the
 * scrolling is an enhancement on top of a real address, never a replacement
 * for one.
 */
export default function NavLink({
  href,
  anchor,
  className,
  onNavigate,
  children,
}: {
  href: string;
  /** The id of the block on the entry page, when the link has a twin there. */
  anchor?: string;
  className?: string;
  /** Lets the mobile sheet close itself when a link inside it is used. */
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onEntryPage = pathname === "/";
  const scrolls = Boolean(anchor) && onEntryPage;

  return (
    <Link
      href={scrolls ? { pathname: "/", hash: anchor } : href}
      className={className}
      onClick={() => onNavigate?.()}
    >
      {children}
    </Link>
  );
}
