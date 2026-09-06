import type { Metadata, Viewport } from "next";
import { site } from "@/lib/i18n";
import { venueTab } from "@/lib/venue-nav";
import { getLang } from "@/lib/lang";
import BottomNav from "@/components/BottomNav";
import { inter, mono, serif } from "./fonts";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import JsonLd from "@/components/JsonLd";
import { SITE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { organisation, website } from "@/lib/schema";

export const metadata: Metadata = {
  // Every relative URL in any page's metadata resolves against this. Without
  // it Next cannot build an absolute og:image and drops the tag, which is the
  // quiet way a link ends up sharing as a bare address.
  metadataBase: new URL(SITE_URL),
  // The default for pages that set none. The landing page overrides both in
  // the reader's language; this is the Uzbek fallback.
  title: {
    default: site("uz").metaTitle,
    // A page that sets a title gets the brand appended once, here, rather than
    // writing "— Flex" at forty call sites and forgetting it at six.
    template: `%s — ${SITE_NAME}`,
  },
  description: site("uz").metaDescription,
  // No openGraph or alternates here on purpose. Next merges those two objects
  // shallowly, so a canonical set in the layout is inherited by every page
  // that does not set its own — which told a crawler that /shaxsiy, /biznes,
  // /qurilmalar and /rezidentlar were all duplicates of the homepage. Each
  // indexable page calls social() with its own path instead; the pages that
  // are noindex emit no canonical at all, which is what they should do.
  // iOS reads these rather than the manifest when added to the home screen.
  appleWebApp: {
    capable: true,
    title: "Flex",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // Tints the browser and system UI around an installed window.
  themeColor: "#0e0a1b",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  const t = site(lang);

  // Costs a signed-out visitor nothing: it returns null as soon as there is no
  // session, without asking the database anything.
  const venue = await venueTab();

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${mono.variable} ${serif.variable} h-full antialiased`}
    >
      {/* The bar is fixed, so the page needs room under it. Phones only —
          `pb-16` is undone at the breakpoint where the bar disappears. */}
      <body className="flex min-h-full flex-col bg-white pb-16 text-flex-black lg:pb-0">
        {children}
        <BottomNav
          labels={{
            home: t.navHome,
            residents: t.navResidents,
            feed: t.navFeed,
            cabinet: t.navCabinet,
            requests: t.navRequests,
          }}
          venue={venue}
        />
        <ServiceWorkerRegistrar />

        {/* Who the site is and what it is, once for the whole site. Both carry
            an @id, so a page that needs to point at either — a profile saying
            which site it is part of — refers to it instead of repeating it. */}
        <JsonLd data={organisation()} />
        <JsonLd data={website()} />
      </body>
    </html>
  );
}
