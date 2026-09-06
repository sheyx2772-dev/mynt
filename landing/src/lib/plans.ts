// What a buyer pays, in three parts that are deliberately not one.
//
// The number is bought once and is theirs. The object carrying it is
// manufactured and priced on its own (see `devices.ts`). The platform that
// answers when somebody taps it costs money every month, so it is paid for
// every month.
//
// Keeping them apart is what stops the business going quietly backwards: a
// single payment against a cost that never ends is a slow loss, and every
// buyer's profile has to stay up for as long as they own the number.
//
// These figures are the same ones the old site sold on and the backend bills
// from. Changing one here changes a price on a page and nothing else — the
// authority is the server, which decides money from the stored row.

/** A person, paying for their own profile. Monthly, or ten months for a year. */
export const PERSONAL_MONTHLY = 49_000;
export const PERSONAL_YEARLY = 490_000;

/** A company buying numbers for staff, by the seat. */
export const TEAM_SEAT_MONTHLY = 29_000;
export const MIN_TEAM_SEATS = 5;

/**
 * A venue is priced as a venue, not as seats.
 *
 * Twenty tables charged as twenty seats would be 580 000 a month, against an
 * international market where a whole restaurant pays the equivalent of ten to
 * twenty dollars. So it is banded by how many points it has — a point being a
 * table, a room, a door or a chair.
 *
 * The last band is `null` on purpose: a chain wants a conversation about
 * branding, hardware and invoicing anyway, and any number printed here is one
 * we would end up talking them out of.
 */
export const VENUE_BANDS = [
  { maxPoints: 15, monthly: 149_000 },
  { maxPoints: 40, monthly: 299_000 },
  { maxPoints: Infinity, monthly: null },
] as const;

export const VENUE_ENTRY_MONTHLY = VENUE_BANDS[0].monthly;
