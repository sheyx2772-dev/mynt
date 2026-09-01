import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { listPublicHandles } from "@/lib/handles";

// Claimed profiles are public pages people share, so they belong in the index.
// Unclaimed handles are excluded: there are 17.5M of them and each is a
// price quote, not content.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const handles = await listPublicHandles();

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    // The pages a buyer looks for before paying, and that a payment provider
    // looks for before approving.
    {
      url: `${SITE_URL}/qurilmalar`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
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
