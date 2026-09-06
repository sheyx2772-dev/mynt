import { getTranslations } from "next-intl/server";

import LangSwitch from "@/components/LangSwitch";
import Mark from "@/components/Mark";
import MobileMenu from "@/components/MobileMenu";
import NavLink from "@/components/NavLink";
import { Link } from "@/i18n/navigation";

// The one header, on every page.
//
// The site it replaces had none: fourteen pages each drew their own, and the
// result was one product wearing two uniforms. This is the whole reason it
// lives in the layout rather than in a page.
//
// It sits on the ink ground, and that is a decision rather than a leftover.
// The rule the product keeps is that lime is worn by exactly one element per
// screen; on a white header the header's own call to action lands beside the
// page's, and there are two limes above the fold. The dark band separates them
// by ground: one is chrome, one is the page.

export type Session = {
  /** The number, which is the identity. */
  handle: string;
  initials: string;
} | null;

export default async function SiteHeader({ session }: { session?: Session }) {
  const t = await getTranslations("nav");

  // `anchor` names the block on the entry page, where one exists. Only the
  // price has a twin: personal, business and residents are pages of their own
  // and there is nothing on the entry page to scroll to.
  const items = [
    { href: "/pricing", anchor: "narx", label: t("pricing") },
    { href: "/personal", label: t("personal") },
    { href: "/business", label: t("business") },
    { href: "/residents", label: t("residents") },
    { href: "/cabinet", label: t("cabinet") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-line bg-ink/85 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
        <div className="flex items-center gap-3">
          <MobileMenu
            items={[
              ...items,
              // Only in the sheet: on a wide screen this is a button of its
              // own on the right.
              ...(session ? [] : [{ href: "/login", label: t("signIn") }]),
            ]}
            openLabel={t("openMenu")}
            closeLabel={t("closeMenu")}
          >
            <LangSwitch tone="light" />
          </MobileMenu>

          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold tracking-tight"
          >
            <Mark tone="dark" />
            flex
          </Link>
        </div>

        <nav className="hidden gap-8 text-sm font-medium text-paper-2 lg:flex">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              anchor={item.anchor}
              className="transition-colors hover:text-white"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <LangSwitch tone="dark" />
          </div>

          {/* What is true, rather than what is always true. The old header
              offered "Kirish" to somebody already signed in, so pressing it
              bounced them to the home page with nothing said. */}
          {session ? (
            <Link
              href="/cabinet"
              className="flex h-10 items-center gap-2.5 rounded-input pr-1 pl-1 transition-colors hover:bg-ink-s1"
            >
              <span className="flex size-8 items-center justify-center rounded-full border border-ink-line bg-gold text-xs font-semibold text-ink">
                {session.initials}
              </span>
              <span className="hidden font-mono text-xs font-semibold tracking-[0.14em] text-paper-2 sm:inline">
                {session.handle}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center px-3.5 text-sm font-medium text-paper-2 transition-colors hover:text-white sm:flex"
            >
              {t("signIn")}
            </Link>
          )}

          <Link
            href="/personal"
            className="flex h-10 items-center rounded-input bg-lime px-[18px] text-sm font-semibold text-ink shadow-slab transition-colors hover:bg-lime-press"
          >
            {t("getNumber")}
          </Link>
        </div>
      </div>
    </header>
  );
}
