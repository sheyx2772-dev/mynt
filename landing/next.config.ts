import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
