import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import HeaderAccount, { SignIn } from "@/components/HeaderAccount";
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

export default async function SiteHeader() {
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
              // own on the right. It is listed whether or not the reader is
              // signed in, because deciding would mean reading the session
              // here — and this is a client component's props, computed in the
              // layout, so the whole site would go dynamic to hide one row.
              // Pressing it while signed in lands on the sign-in page, which
              // says so; that is a smaller cost than the one it saves.
              { href: "/login", label: t("signIn") },
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

          {/* Who is asking is the only thing on this page that is not the
              same for everybody, so it is the only thing that waits. The
              signed-out shape is the fallback, so nothing moves for a reader
              who is not signed in and a signed-in one sees it for the length
              of one request rather than a gap that jumps. */}
          <Suspense fallback={<SignIn label={t("signIn")} />}>
            <HeaderAccount />
          </Suspense>

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
