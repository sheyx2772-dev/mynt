// The four kinds of venue this page sells to, in the order it argues them.
//
// The id is three things at once: the anchor a link from the entry page and
// the footer lands on, the prefix every message key of that section carries,
// and the value the enquiry form posts. Keeping them one string is what stops
// `/business#salons` quietly pointing at a section renamed to `#salon`.
//
// Cafes come first and carry no anchor of their own in any existing link —
// `/business` on its own is the cafe link — so the section still gets an id
// for the page's own jump chips.
export type VenueId = "cafes" | "hotels" | "salons" | "clinics";

export type Venue = {
  id: VenueId;
  /** In `public/mahsulot`, cropped to 3:2 at the source's own resolution. */
  photo: string;
  /** Width of the intrinsic file, so a box is never asked for more. */
  photoWidth: number;
};

export const VENUES: readonly Venue[] = [
  { id: "cafes", photo: "/mahsulot/kafe-stol.webp", photoWidth: 1152 },
  { id: "hotels", photo: "/mahsulot/mehmonxona-xona.webp", photoWidth: 1152 },
  { id: "salons", photo: "/mahsulot/salon-orindiq.webp", photoWidth: 1173 },
  { id: "clinics", photo: "/mahsulot/klinika-qabul.webp", photoWidth: 1152 },
] as const;

/**
 * What the enquiry form may say it is about.
 *
 * The list is here rather than in the form because the server action checks
 * against it too: a direction is chosen from a list we wrote, never taken from
 * the request as typed.
 */
export const DIRECTIONS = [
  "cafes",
  "hotels",
  "salons",
  "clinics",
  "teams",
  "other",
] as const;

export type Direction = (typeof DIRECTIONS)[number];

export function isDirection(value: unknown): value is Direction {
  return (
    typeof value === "string" &&
    (DIRECTIONS as readonly string[]).includes(value)
  );
}
