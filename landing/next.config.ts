import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Points the plugin at the request configuration. Without it, `getTranslations`
// has no messages to read and every call throws at render time rather than at
// build time, which is the wrong end of the day to find out.
export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
