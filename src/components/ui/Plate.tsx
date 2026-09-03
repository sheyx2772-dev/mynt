// The number, drawn the same way everywhere.
//
// AAA000 is the logotype. Uzbekistan already has a culture of beautiful
// numbers — a 777 plate, a 001 phone number, both sold for money — so a FLEX
// number is read as the same kind of object: a document. A passport number, a
// vehicle plate, a ticket. Not a username.
//
// That is why this is one component and not a set of styles. The number appears
// on the physical card, on the profile a stranger opens, on a table sticker, in
// the corner of a monthly invoice. Somebody who sees it in two of those places
// should recognise the second from the first, and they only will if it is
// identical: same face, same tracking, same two colours.
//
// Deliberately not here: a lime rule down the left edge. Lime is spent on the
// one thing on a screen that a person is meant to do, and a number is not a
// thing to do.

const SIZES = {
  sm: "h-6 px-2 text-[12px]",
  md: "h-8 px-2.5 text-[15px]",
  lg: "h-12 px-4 text-[24px]",
  // Wall screens only, where a number is read from two metres away.
  xl: "h-20 px-6 text-[44px]",
} as const;

export type PlateSize = keyof typeof SIZES;

export default function Plate({
  n,
  size = "md",
  className = "",
}: {
  n: string;
  size?: PlateSize;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-plate bg-ink text-paper font-display font-bold tracking-[0.06em] num ${SIZES[size]} ${className}`}
    >
      {n}
    </span>
  );
}
