import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { listPublicHandles } from "@/lib/handles";
import { LOADOUT_DEVICES } from "@/lib/loadout";

// Claimed profiles are public pages people share, so they belong in the index.
// Unclaimed handles are excluded: there are 17.5M of them and each is a
// price quote, not content.
//
// /tarif is deliberately absent. It still answers, but only with a redirect to
// /shaxsiy#tarif, and a sitemap that lists a redirect spends a crawler's visit
// telling it to go somewhere else.
// Generated on request and cached for an hour, not frozen at build time. A
// sitemap of who is on the site is only useful if it reflects who is on the
// site, and prerendering it would freeze it at whatever the list was when the
// image was built.
export const revalidate = 3600;

// The static pages change when somebody edits them, which is a deploy. Stamping
// them with the build date says that; stamping them with `new Date()` said that
// every page changed the moment the crawler asked, which is how a lastmod stops
// being read at all.
const RELEASED = new Date(process.env.BUILD_DATE ?? "2026-09-06T00:00:00Z");

// The same three-language cluster the pages themselves declare in their
// hreflang tags. Repeating it here is not redundancy: a crawler that has not
// fetched a page yet learns from the sitemap that the other two exist, which
// is the difference between the Russian page being discovered on the first
// visit and on the third.
function langs(path: string): { languages: Record<string, string> } {
  const base = `${SITE_URL}${path}`;
  return {
    languages: {
      "x-default": base,
      uz: base,
      ru: `${base}?til=ru`,
      en: `${base}?til=en`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const handles = await listPublicHandles();

  return [
    {
      url: SITE_URL,
      alternates: langs(""),
      lastModified: RELEASED,
      changeFrequency: "weekly",
      priority: 1,
    },
    // The two product pages. The entry page is a fork and explains neither, so
    // these are what a search for "NFC vizitka" or "kafe menyu NFC" should
    // land on.
    {
      url: `${SITE_URL}/shaxsiy`,
      alternates: langs("/shaxsiy"),
      lastModified: RELEASED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/biznes`,
      alternates: langs("/biznes"),
      lastModified: RELEASED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // The pages a buyer looks for before paying, and that a payment provider
    // looks for before approving.
    {
      url: `${SITE_URL}/qurilmalar`,
      alternates: langs("/qurilmalar"),
      lastModified: RELEASED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // One page per object. These are what a search for "NFC uzuk" or
    // "avtovizitka" should reach, and they carry the price, so they are worth
    // more to a buyer than the index above them.
    ...LOADOUT_DEVICES.map((id) => ({
      url: `${SITE_URL}/qurilmalar/${id}`,
      alternates: langs(`/qurilmalar/${id}`),
      lastModified: RELEASED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // The directory. Every row is a public profile that is in this sitemap
    // anyway, and the page itself is the one place they are all linked from.
    {
      url: `${SITE_URL}/rezidentlar`,
      alternates: langs("/rezidentlar"),
      lastModified: RELEASED,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/shartlar`,
      alternates: langs("/shartlar"),
      lastModified: RELEASED,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...handles.map((h) => ({
      url: `${SITE_URL}/${h.normalized}`,
      lastModified: h.updatedAt ? new Date(h.updatedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
