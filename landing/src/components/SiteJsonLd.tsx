import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { absolute } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Who publishes this site, in the form a search engine reads.
//
// Two objects rather than one, joined by `@id`: the company is a thing that
// exists off the web and the site is a thing that exists on it, and a knowledge
// panel is built from the first while a search result is labelled with the
// second. Emitted once, from the layout, so every page of the site carries it
// and no page carries it twice. `Faq.tsx` emits the FAQPage the same way and is
// the only other structured data on the site.
//
// NOTHING ABOUT A PERSON GOES IN HERE. Not a customer's name, not their number,
// not the profile they own — structured data is the machine-readable half of a
// page, and a customer's contact details written into it are contact details
// published in a format built for harvesting. A profile page describes itself
// in its own metadata, from what its owner chose to show.
//
// The postal address is left out for a version of the same reason: the address
// on the company's registration is a flat in Bektemir, not a shop somebody can
// walk into, and an `Organization` is complete without one. The details that
// are here are the ones already printed in the footer and on the offer, which
// is where a buyer and a payment provider look for them.

export default async function SiteJsonLd() {
  const t = await getTranslations("site");

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: t("name"),
        legalName: COMPANY.legalName,
        taxID: COMPANY.inn,
        url: SITE_URL,
        logo: absolute("/icon-512.png"),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: COMPANY.phoneHref,
          email: COMPANY.email,
          areaServed: "UZ",
          availableLanguage: [...routing.locales],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: t("name"),
        url: SITE_URL,
        inLanguage: [...routing.locales],
        publisher: { "@id": `${SITE_URL}#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
