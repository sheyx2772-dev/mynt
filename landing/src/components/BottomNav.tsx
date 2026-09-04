"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Rss, User, BellRing } from "lucide-react";

// The bar at the bottom of the screen, on phones only.
//
// This is the single strongest signal that something is an app rather than a
// page: the places you can go are always under your thumb instead of being
// found by scrolling to a header. On a desktop it is the wrong shape entirely,
// so it is not rendered there — that is the whole of the phone/desktop split,
// not a separate codebase.
//
// Four destinations, because five is a menu and three leaves out the cabinet.
//
// The third one depends on who is holding the phone. For most people it is the
// posts feed; for somebody whose number is a cafe it is the requests screen,
// which they open forty times a day and which was three taps deep inside the
// cabinet. The other three are the same for everybody.

const BASE = [
  { href: "/", icon: Home, key: "home" },
  { href: "/rezidentlar", icon: Users, key: "residents" },
] as const;

export default function BottomNav({
  labels,
  venue,
}: {
  labels: {
    home: string;
    residents: string;
    feed: string;
    cabinet: string;
    requests: string;
  };
  /** Set when this account owns a venue; the third tab becomes its inbox. */
  venue: { handle: string; waiting: number } | null;
}) {
  const pathname = usePathname();

  // A profile is somebody's card, not a page of ours: the bar would frame it as
  // one of our screens and take a fifth of the phone doing it. The client check
  // here is the second line of defence — the first is a CSS rule keyed to a
  // marker the profile renders, which applies before any JavaScript runs and so
  // avoids the bar appearing and then vanishing.
  if (/^\/[A-Za-z]{3}[0-9]{3}$/.test(pathname)) return null;

  const items = [
    ...BASE,
    venue
      ? {
          href: `/kabinet/${venue.handle}/sorovlar`,
          icon: BellRing,
          key: "requests" as const,
          badge: venue.waiting,
        }
      : { href: "/lenta", icon: Rss, key: "feed" as const, badge: 0 },
    { href: "/kabinet", icon: User, key: "cabinet" as const, badge: 0 },
  ];

  return (
    <nav className="app-bar fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md lg:hidden">
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, icon: Icon, key, ...rest }) => {
          const badge = "badge" in rest ? rest.badge : 0;
          // The cabinet must not light up while the requests tab, which lives
          // underneath it, is the page being looked at.
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/kabinet"
                ? pathname === "/kabinet"
                : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex flex-col items-center gap-1 py-2.5 text-flex-black"
                    : "flex flex-col items-center gap-1 py-2.5 text-flex-black/40 transition-colors hover:text-flex-black/70"
                }
              >
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 font-tabular text-[10px] font-semibold text-flex-black">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] tracking-[0.08em]">{labels[key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Clears the home indicator on a phone with no button. */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
