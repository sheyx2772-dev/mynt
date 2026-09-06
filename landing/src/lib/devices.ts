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
  /** The object in use, for its own page. Not every device has one yet. */
  scene?: string;
  price: number;
};

export const DEVICES: Device[] = [
  { slug: "card", photo: "karta", price: 200_000 },
  { slug: "ring", photo: "uzuk", price: 350_000 },
  { slug: "band", photo: "braslet", price: 250_000 },
  { slug: "cartag", photo: "avto", scene: "avto-joyida", price: 150_000 },
  { slug: "pettag", photo: "hayvon", price: 120_000 },
  { slug: "stand", photo: "stend", scene: "stend-joyida", price: 250_000 },
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
