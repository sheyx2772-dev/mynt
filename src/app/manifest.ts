import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mynt — raqamli shaxs",
    short_name: "Mynt",
    description:
      "Noyob raqamli handle, shaxsiy vizit-karta sahifasi va NFC karta orqali shaxsingizni ulashing.",
    lang: "uz",
    // An installed copy belongs to someone who owns a handle, so it opens on
    // their cabinet rather than the marketing page. Signed-out launches are
    // redirected to sign-in and land back here.
    start_url: "/kabinet",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0e0a1b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Bleeds to the edges so a launcher can crop it to any shape.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
