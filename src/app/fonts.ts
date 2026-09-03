import { Inter, Unbounded } from "next/font/google";

// Two families, and the reason is Cyrillic.
//
// Space Grotesk, which this used to set headings in, has no Cyrillic at all.
// Menus run in three languages; a Russian heading — "Салаты", "Горячее" —
// silently fell back to whatever the device had, and the page came apart. Half
// the audience here reads Cyrillic and nearly every cafe menu carries a Russian
// column, so that was not a cosmetic problem.
//
// Unbounded is wide, has Cyrillic, and keeps 0/O and 1/I apart — which is the
// whole job, because the thing it mostly sets is a number somebody has to read
// off a card and type back in.

export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Only the two weights the display face is ever used at. Every extra weight is
// another file on a 3G connection.
export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  variable: "--font-unbounded",
  display: "swap",
});
