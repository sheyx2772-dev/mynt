import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Sign-in and its callbacks carry one-time tokens and have nothing to
      // index; /z/ is the counter link, where the address itself is the
      // credential and one appearing in a search result is one leaked.
      disallow: ["/kirish", "/auth/", "/chiqish", "/z/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
