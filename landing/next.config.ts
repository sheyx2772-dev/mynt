import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE — every page is server-rendered per request, and that is a cost this
  // file is the right place to record.
  //
  // The header shows who is signed in. Reading a cookie makes a render
  // dynamic, and the header lives in the layout, so one button took the whole
  // marketing site out of prerendering. The `Suspense` boundary around it does
  // not save that on its own: without partial prerendering the boundary
  // streams, but the shell around it is still built per request.
  //
  // `cacheComponents: true` is the fix and it is one line. It is not here yet
  // because it refuses two route segment configs that landed the same day —
  // `dynamic = "force-dynamic"` on the feed and `revalidate` on the directory
  // — and rewriting those to `use cache` is a change worth making on its own
  // rather than folded into a header. Until then: rendering these pages costs
  // milliseconds, nothing is behind a CDN that static files would have fed,
  // and the live sections come back fresher. Indexing is unaffected — the HTML
  // is complete either way.

  images: {
    // Every quality a component is allowed to ask for.
    //
    // Next 16 refuses any value not on this list with a 400 and no image at
    // all — which is worse than the soft tile it was meant to fix, and it
    // fails silently: the markup is right, the file is right, and the picture
    // is simply absent. 90 is here because a 276-pixel tile has few pixels to
    // spend and every artefact at 75 lands on a face.
    qualities: [75, 90],

    // Every host an avatar may come from, named exactly.
    //
    // `next/image` optimises a remote file by fetching it FROM THE SERVER, so
    // a wildcard here does not merely allow a picture — it turns the site into
    // an open image proxy pointed at whatever a profile owner typed into their
    // avatar field, including addresses only our own container network can
    // reach. The backend is one of those. So this list stays a list.
    remotePatterns: [
      // Uploads. MinIO is served under the site's own host at a path prefix,
      // which is also why there is no second certificate to keep alive.
      {
        protocol: "https",
        hostname: "arend.uz",
        pathname: "/flex-images/**",
      },
      // Seeded demo rows only. Delete this entry — and re-point the rows that
      // use it — before the site is announced: it is a third party serving
      // faces on our pages, and it is in this file because two of the five
      // numbers in the directory today are fixtures rather than customers.
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
};

// Points the plugin at the request configuration. Without it, `getTranslations`
// has no messages to read and every call throws at render time rather than at
// build time, which is the wrong end of the day to find out.
export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
