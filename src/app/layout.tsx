import type { Metadata, Viewport } from "next";
import { site } from "@/lib/i18n";
import { venueTab } from "@/lib/venue-nav";
import { getLang } from "@/lib/lang";
import BottomNav from "@/components/BottomNav";
import { inter, mono } from "./fonts";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  // The default for pages that set none. The landing page overrides both in
  // the reader's language; this is the Uzbek fallback.
  title: `Flex — ${site("uz").tagline}`,
  description: site("uz").metaDescription,
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
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
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
      </body>
    </html>
  );
}
