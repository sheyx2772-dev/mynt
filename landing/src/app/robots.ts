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
      // Everything behind a session, and every one-time token. None of it is
      // useful in an index and some of it is somebody's own data: /kabinet is
      // the owner's whole cabinet, /x/ and /z/ are single-use links, and
      // /buyurtma is an order somebody is paying for.
      disallow: [
        "/kirish",
        "/auth/",
        "/chiqish",
        "/kabinet",
        "/buyurtma/",
        "/x/",
        "/z/",
        // Every outbound link on a profile goes through a counting redirect.
        // Ten of them per profile, none with anything at the other end that
        // belongs to this site.
        "/*/go",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
