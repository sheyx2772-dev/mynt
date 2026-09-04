import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Stable identity. Without it the browser derives one from start_url, and
    // changing that later would install a second, unrelated app beside the one
    // people already have.
    id: "/",
    // The brand name alone, in every language.
    //
    // The site is trilingual and this file cannot be: a manifest is fetched
    // with credentials omitted, so the language cookie never reaches it and a
    // per-language manifest would silently always be Uzbek. "Flex — raqamli
    // shaxs" in the install dialog told a Russian visitor the app was not for
    // them, which is worse than saying nothing beyond the name.
    name: "Flex",
    short_name: "Flex",
    description:
      "Noyob raqam, shaxsiy profil va NFC karta. Bir tegish bilan shaxsingizni ulashing.",
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
    // Long-pressing the icon jumps straight to a screen.
    //
    // Every one of these has to work for somebody who owns no handle and for
    // somebody who owns six, which rules out anything with a number in the
    // path: /kabinet/qr would have to guess which card. So they are the three
    // destinations that are the same address for everyone, and the cabinet
    // sends each of them on to whichever number is open.
    shortcuts: [
      { name: "So'rovlar", short_name: "So'rovlar", url: "/kabinet?ish=sorovlar" },
      { name: "QR-kod", short_name: "QR", url: "/kabinet?ish=qr" },
      { name: "Xabarlar", short_name: "Xabarlar", url: "/kabinet/xabarlar" },
    ],
  };
}
