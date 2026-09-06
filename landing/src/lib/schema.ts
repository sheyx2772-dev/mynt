import { SITE_NAME, absolute } from "./seo";
import { SITE_URL } from "./site-url";
import { COMPANY } from "./company";

// The claims a page makes about itself in schema.org's vocabulary.
//
// Kept apart from the metadata helpers because these are assertions rather
// than tags: an Organization that names the wrong company, or an Offer with a
// price that no longer matches the price list, is worse than saying nothing.
// So each builder takes its numbers from the same place the page renders them
// from — never a literal repeated here.

/** Who the site belongs to. Emitted once, on the root layout. */
export function organisation() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: absolute("/icon-512.png"),
    // The registered details, which are on the terms page anyway and are what
    // a search engine matches a company against. Taken from COMPANY so they
    // cannot disagree with the invoice that quotes the same fields.
    taxID: COMPANY.inn,
    telephone: COMPANY.phoneHref,
    email: COMPANY.email,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: COMPANY.phoneHref,
      contactType: "sales",
      availableLanguage: ["uz", "ru", "en"],
    },
    // Deliberately not a LocalBusiness and deliberately no street address: the
    // registered address is a flat with no counter to walk into, and a listing
    // that sends somebody to a residential door is the kind that gets pulled.
    // The city is true and useful; the doorway is neither.
    areaServed: [
      { "@type": "City", name: "Toshkent" },
      { "@type": "Country", name: "Uzbekistan" },
    ],
  };
}

/** The site itself, so a search engine can offer a search box for it. */
export function website() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: ["uz", "ru", "en"],
    potentialAction: {
      "@type": "SearchAction",
      // The directory is the only place that searches across profiles.
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/rezidentlar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * A question-and-answer list.
 *
 * Only for a list that is genuinely on the page: Google treats an FAQPage
 * whose answers are not visible to a reader as a manual-action offence, and
 * the penalty is the site's rich results rather than the one page's.
 */
export function faqPage(faqs: readonly { readonly q: string; readonly a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * A claimed profile: a page about a person, or about a company.
 *
 * `ProfilePage` wrapping the subject is what Google asks for — the page is not
 * the person, it is a page about them, and conflating the two is why an
 * author's name sometimes attaches to a site instead of to a byline.
 */
export function profilePage({
  handle,
  name,
  bio,
  avatarUrl,
  position,
  company,
  city,
  team,
}: {
  handle: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  position: string | null;
  company: string | null;
  city: string | null;
  team: { name: string; website: string | null } | null;
}) {
  const url = `${SITE_URL}/${handle}`;

  // A company handle describes an organisation; a personal one a person. The
  // difference is not cosmetic — Person carries jobTitle and worksFor, and an
  // Organization with a jobTitle is invalid.
  const subject = team
    ? {
        "@type": "Organization",
        name: team.name,
        ...(team.website ? { url: team.website } : {}),
        ...(avatarUrl ? { logo: avatarUrl } : {}),
      }
    : {
        "@type": "Person",
        name,
        ...(bio ? { description: bio } : {}),
        ...(avatarUrl ? { image: avatarUrl } : {}),
        ...(position ? { jobTitle: position } : {}),
        ...(company ? { worksFor: { "@type": "Organization", name: company } } : {}),
        ...(city ? { address: { "@type": "PostalAddress", addressLocality: city } } : {}),
      };

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    name,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: { "@id": `${url}#subject`, ...subject },
  };
}

/**
 * The trail above a page.
 *
 * Google draws it in place of the raw URL in a result, which for a profile is
 * the difference between "flex.com.uz › QXD483" and the address itself.
 */
export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  };
}

/**
 * One object for sale, with its price.
 *
 * Google shows the price and the availability under the result rather than
 * only the title, which for a page whose whole job is "this costs 200 000
 * so'm" is most of what the page says. Priced in so'm because that is what the
 * buyer pays; a device with no fixed price — the car plate is quoted per
 * order — omits `offers` rather than inventing one, since a wrong price in a
 * rich result is worse than none.
 */
export function product({
  name,
  description,
  path,
  image,
  price,
}: {
  name: string;
  description: string;
  path: string;
  image?: string;
  price: number | null;
}) {
  const url = absolute(path);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name,
    description,
    ...(image ? { image: absolute(image) } : {}),
    brand: { "@type": "Brand", name: "FLEX" },
    ...(price !== null
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: String(price),
            priceCurrency: "UZS",
            availability: "https://schema.org/InStock",
            seller: { "@id": `${SITE_URL}/#organization` },
          },
        }
      : {}),
  };
}


/**
 * A venue's menu, as a menu.
 *
 * This is the one page on the site where a rich result answers the query
 * somebody actually typed — "kafe menyu Toshkent" wants a menu with prices,
 * and the venue branch was emitting no structured data at all. Every field
 * comes from what the page renders, so a dish hidden by the owner is absent
 * here too rather than being advertised and then not served.
 */
export function venueSchema({
  name,
  kind,
  path,
  hours,
  address,
  categories,
}: {
  name: string;
  kind: "cafe" | "hotel" | "shop" | "other";
  path: string;
  hours: string | null;
  address: string | null;
  categories: { name: string; items: { name: string; note: string | null; price: number; available: boolean }[] }[];
}) {
  const url = absolute(path);
  const type =
    kind === "cafe" ? "Restaurant" : kind === "hotel" ? "Hotel" : "Store";

  const sections = categories
    .map((c) => ({
      "@type": "MenuSection" as const,
      name: c.name,
      hasMenuItem: c.items
        .filter((i) => i.available)
        .map((i) => ({
          "@type": "MenuItem" as const,
          name: i.name,
          ...(i.note ? { description: i.note } : {}),
          offers: { "@type": "Offer", price: String(i.price), priceCurrency: "UZS" },
        })),
    }))
    .filter((s) => s.hasMenuItem.length > 0);

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#venue`,
    name,
    url,
    ...(hours ? { openingHours: hours } : {}),
    ...(address ? { address: { "@type": "PostalAddress", streetAddress: address } } : {}),
    ...(sections.length > 0
      ? { hasMenu: { "@type": "Menu", hasMenuSection: sections } }
      : {}),
  };
}

/**
 * A list of pages, so the shelf and the directory link their own contents in
 * the graph rather than leaving each page to be found on its own.
 */
export function itemList(entries: { url: string; name: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: entries.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absolute(e.url),
      name: e.name,
    })),
  };
}


/**
 * A subscription or a one-off, priced.
 *
 * The two product pages carry the whole price list in their body and said
 * nothing about it in the graph, so a search result for them could show a
 * title and no price. Both figures come from the modules the page renders
 * from; a band with no published price is left out rather than guessed at.
 */
export function service({
  name,
  description,
  path,
  serviceType,
  offers,
}: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  offers: { price: number; description: string; recurring?: boolean }[];
}) {
  const url = absolute(path);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    serviceType,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "Uzbekistan" },
    offers: offers.map((o) => ({
      "@type": "Offer",
      url,
      description: o.description,
      priceCurrency: "UZS",
      ...(o.recurring
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: String(o.price),
              priceCurrency: "UZS",
              billingIncrement: 1,
              unitCode: "MON",
            },
          }
        : { price: String(o.price) }),
    })),
  };
}
