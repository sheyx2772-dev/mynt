import type { NextConfig } from "next";

// Deliberately empty. `output: "standalone"` used to be set here, which bundles
// a self-contained server for running in a container. Vercel supplies its own
// runtime and reads the default build's file traces instead, so standalone
// output made the deploy fail: its onBuildComplete step opens
// .next/next-server.js.nft.json, which standalone mode never writes.
//
// Put it back only alongside a host that actually runs the standalone server.
const nextConfig: NextConfig = {};

export default nextConfig;
