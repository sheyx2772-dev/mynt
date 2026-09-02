import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { listPublicHandles } from "@/lib/handles";

// Claimed profiles are public pages people share, so they belong in the index.
// Unclaimed handles are excluded: there are 17.5M of them and each is a
// price quote, not content.
//
// /tarif is deliberately absent. It still answers, but only with a redirect to
// /shaxsiy#tarif, and a sitemap that lists a redirect spends a crawler's visit
// telling it to go somewhere else.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const handles = await listPublicHandles();

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    // The two product pages. The entry page is a fork and explains neither, so
    // these are what a search for "NFC vizitka" or "kafe menyu NFC" should
    // land on.
    {
      url: `${SITE_URL}/shaxsiy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/biznes`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // The pages a buyer looks for before paying, and that a payment provider
    // looks for before approving.
    {
      url: `${SITE_URL}/qurilmalar`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // The directory. Every row is a public profile that is in this sitemap
    // anyway, and the page itself is the one place they are all linked from.
    {
      url: `${SITE_URL}/rezidentlar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/shartlar`,
      lastModified: new Date(),
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
