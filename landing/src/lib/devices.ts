// What a number can be carried on.
//
// The number and the object are priced apart because they are different kinds
// of thing: a number is scarce and priced by how scarce it is, an object is
// manufactured and priced by what it costs to make. Folding the object into
// the number's price would have a rare number quietly subsidising the same
// piece of steel a common one gets.
//
// Slugs are English because addresses are (`/devices/ring`), and they are the
// key into the message catalogue too — one name per device, in one place, so a
// device cannot be called a ring on the shelf and a band on its own page.
export type Device = {
  slug: string;
  /** Cut-out on the shelf ground, 900x900, under public/mahsulot. */
  photo: string;
  /**
   * The same object on its own page, 1400x1050 and never upscaled past 1.35x.
   *
   * A separate file rather than the tile shown larger, because the tile is
   * mostly ground: these renders carry between 450 and 1350 pixels of actual
   * object, so a square crop blown up to a half-width column was showing a
   * two-times enlargement of the smallest part of the file. The ring is the
   * floor at 487 pixels across — it needs re-rendering to be crisp any bigger,
   * and no amount of sharpening substitutes for that.
   */
  large: string;
  /** The object in use, for its own page. Not every device has one yet. */
  scene?: string;
  price: number;
};

export const DEVICES: Device[] = [
  { slug: "card", photo: "karta", large: "karta-katta", price: 200_000 },
  { slug: "ring", photo: "uzuk", large: "uzuk-katta", price: 350_000 },
  { slug: "band", photo: "braslet", large: "braslet-katta", price: 250_000 },
  // prettier-ignore
  { slug: "cartag", photo: "avto", large: "avto-katta", scene: "avto-joyida", price: 150_000 },
  { slug: "pettag", photo: "hayvon", large: "hayvon-katta", price: 120_000 },
  // prettier-ignore
  { slug: "stand", photo: "stend", large: "stend-katta", scene: "stend-joyida", price: 250_000 },
];

/** The four on the entry page. The rest are one click away, on the shelf. */
export const SHELF = DEVICES.slice(0, 4);

export function deviceBySlug(slug: string): Device | undefined {
  return DEVICES.find((d) => d.slug === slug);
}

/**
 * `200 000`, with the thousands held together.
 *
 * A non-breaking space rather than a plain one: a price that wraps after the
 * first digit reads as two hundred, and it wraps exactly where the number is
 * long enough to matter.
 */
export function money(sum: number): string {
  return sum.toLocaleString("ru-RU").replace(/\s/g, " ");
}
