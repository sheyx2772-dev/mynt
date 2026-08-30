import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Sign-in and its callbacks carry one-time tokens and have nothing to index.
      disallow: ["/kirish", "/auth/", "/chiqish"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
