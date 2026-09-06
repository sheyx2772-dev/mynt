import { getLocale } from "next-intl/server";

import { ownerOf } from "@/lib/backend/profile";
import { themeFor } from "@/lib/profile/theme";
import { inter, mono, serif } from "../../../fonts";
import "../../../globals.css";

// A profile is its own document, not a page of the site.
//
// No header and no footer: whoever is holding this phone tapped somebody's
// card. They are not shopping, they have never heard of us, and a nav bar with
// "Narxlar" and "Kirish" in it is four things to press by accident on the way
// to a phone number. The one line about Flex is at the bottom, after what they
// came for. `(site)` carries its own `<html>` for the same reason this does —
// there is no root layout above either of them to inherit.
//
// The language is negotiated rather than read from the address: `/VIP777` is
// engraved on plastic and carries no locale, so `i18n/request.ts` decides it
// from the reader's cookie and `Accept-Language`. `<html lang>` has to say the
// same thing, or a screen reader pronounces a Russian profile in Uzbek.

export const dynamic = "force-dynamic";

export default async function ProfileLayout({
  children,
  params,
}: LayoutProps<"/p/[handle]">) {
  const { handle } = await params;
  const locale = await getLocale();

  let dizayn: string | undefined;
  try {
    const owner = await ownerOf(handle.toUpperCase());
    dizayn = owner?.dizayn;
  } catch {}

  const theme = themeFor(dizayn);

  return (
    <html
      lang={locale}
      style={theme.style}
      className={`${inter.variable} ${mono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="relative min-h-full bg-[var(--p-ground)] text-[var(--p-text)] transition-colors duration-300">
        {/* Themed Ambient Pattern Backdrop */}
        {theme.patternStyle && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 opacity-70 transition-opacity duration-500"
            style={theme.patternStyle}
          />
        )}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
