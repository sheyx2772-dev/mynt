import { Inter, JetBrains_Mono } from "next/font/google";

// Two families, and the second one is for numbers.
//
// Space Grotesk used to set the headings and it carries no Cyrillic at all.
// Menus run in three languages and nearly every cafe here keeps a Russian
// column, so a heading like "Салаты" was silently falling back to whatever the
// device had and the page came apart. Both faces below have Cyrillic.
//
// There is no separate display face any more. What makes a FLEX screen
// recognisable is the number, not a headline font — so the weight goes there:
// JetBrains Mono, wide-tracked, for the plate, the engraving on the card and
// every price. It keeps 0/O and 1/I apart, which is the whole job when the
// thing being read is a number somebody types back in from a card.

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
