import type { NextConfig } from "next";

// `output: "standalone"` used to be set here, which bundles a self-contained
// server for running in a container. Vercel supplies its own runtime and reads
// the default build's file traces instead, so standalone output made the deploy
// fail: its onBuildComplete step opens .next/next-server.js.nft.json, which
// standalone mode never writes. Put it back only alongside a host that actually
// runs the standalone server.

// The host already sends HSTS. These are the rest of the headers a public site
// should not be missing — deliberately the ones that cannot break a page:
// no Content-Security-Policy here, because getting one wrong silently kills
// scripts and styles, and that belongs in its own change with its own testing.
const securityHeaders = [
  // Stop a browser second-guessing a Content-Type. The QR route serves SVG and
  // avatars come from R2; neither should ever be sniffed into something else.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // A profile is public, but the cabinet is not: framing it elsewhere is only
  // useful for dressing up a click the owner did not mean to make.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Outbound clicks from a profile carry the origin, never the full path —
  // a handle is a person, and the page they came from is theirs to share.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here asks for hardware. Say so, so an injected script cannot.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
