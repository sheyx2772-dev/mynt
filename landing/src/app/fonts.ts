import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";

// Two families, and the second one is for numbers.
//
// Every face here carries Cyrillic, and that is the requirement rather than a
// bonus: the site runs in three languages and nearly every page has a Russian
// column. A heading like "Салаты" set in a face without Cyrillic falls back
// silently to whatever the device has, and the page comes apart on exactly the
// screens nobody is looking at.
//
// There is no separate display face. What makes a Flex screen recognisable is
// the number, not a headline font — so the weight goes there: JetBrains Mono,
// wide-tracked, for the plate, the engraving on the card and every price. It
// keeps 0/O and 1/I apart, which is the whole job when the thing being read is
// a number somebody types back in from a card.

export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

// The ceremonial face.
//
// Not every profile wants to look like a form. A wedding photographer, a
// restaurant, somebody who bought the number because it is a nice number —
// they want a certificate, and a certificate is set in a serif.
//
// Playfair rather than one of the fashionable ones because it carries
// Cyrillic: half the audience reads it, and a display face that drops to a
// fallback halfway through a Russian name is worse than no display face.
export const serif = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  variable: "--font-playfair",
  display: "swap",
  // One layout in seven reaches for it, and preloading puts a woff2 with
  // Cyrillic in it in front of everything that actually renders.
  preload: false,
});
