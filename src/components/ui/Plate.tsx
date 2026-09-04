// The number, struck rather than written.
//
// AAA000 is the logotype. Uzbekistan already has a culture of beautiful
// numbers — a 777 plate, a 001 phone number, both sold for money — so a FLEX
// number is read as the same kind of object: a document number. A passport, a
// vehicle registration, a ticket.
//
// So it is drawn as one: a "№" outside the plate, a strip of gold down the
// leading edge, the letters and the digits in monospace with a hairline
// between them. The divider is the thing that makes it a registration rather
// than a username — MYN042 is a string, MYN | 042 is an issued number.
//
// It appears in exactly three places, always identical: engraved on the card
// face, struck under the owner's name, and stamped in the footer. Somebody who
// sees it in two of them should recognise the second from the first.
//
// Deliberately not here: lime. Lime marks the one thing on a screen a person
// is meant to do, and a number is not a thing to do.

const SIZES = {
  sm: { box: "h-8", edge: "w-1", text: "px-2 text-[14px]", mark: "text-[12px]" },
  md: { box: "h-11", edge: "w-1.5", text: "px-3 text-[18px]", mark: "text-[14px]" },
  lg: { box: "h-14", edge: "w-2", text: "px-4 text-[26px]", mark: "text-[16px]" },
  // Wall screens, read from two metres.
  xl: { box: "h-20", edge: "w-3", text: "px-6 text-[40px]", mark: "text-[20px]" },
} as const;

export type PlateSize = keyof typeof SIZES;

export default function Plate({
  n,
  size = "md",
  mark = true,
  className = "",
}: {
  n: string;
  size?: PlateSize;
  /** The № outside the plate. Dropped where the context already says it. */
  mark?: boolean;
  className?: string;
}) {
  const s = SIZES[size];

  // Three letters and three digits, where the number is one of ours. A genesis
  // serial is six digits and has no seam to show, so it is set whole.
  const split = /^([A-Z]{3})(\d{3})$/.exec(n.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark && (
        <span className={`font-medium tracking-wide text-mute ${s.mark}`}>№</span>
      )}
      <span
        className={`inline-flex items-stretch overflow-hidden rounded-md bg-ink text-paper shadow-slab ${s.box}`}
      >
        <span className={`bg-gold/90 ${s.edge}`} aria-hidden />
        {split ? (
          <>
            <span
              className={`flex items-center font-mono font-semibold tracking-[0.16em] tabular-nums ${s.text}`}
            >
              {split[1]}
            </span>
            <span className="my-2.5 w-px bg-paper/25" aria-hidden />
            <span
              className={`flex items-center font-mono font-semibold tracking-[0.16em] tabular-nums ${s.text}`}
            >
              {split[2]}
            </span>
          </>
        ) : (
          <span
            className={`flex items-center font-mono font-semibold tracking-[0.16em] tabular-nums ${s.text}`}
          >
            {n}
          </span>
        )}
      </span>
    </span>
  );
}
