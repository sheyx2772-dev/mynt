// The number, struck rather than written.
//
// Uzbekistan already sells beautiful numbers — a 777 car plate, a 001 phone
// number — so a Flex number is read as the same kind of object: an issued
// document number rather than a username. That is what the drawing has to say,
// and it says it with three things — the "№" standing outside the block, a
// metallic edge down the leading side, and a hairline splitting the letters
// from the digits. MYN042 is a string; MYN | 042 is a registration.
//
// No lime in here. Lime marks the one thing on a screen a person is meant to
// do, and a number is not a thing to do.

const SIZES = {
  sm: {
    box: "h-8",
    edge: "w-1",
    cell: "px-2 text-[13px]",
    mark: "text-[11px]",
    rule: "my-2",
  },
  md: {
    box: "h-11",
    edge: "w-1.5",
    cell: "px-3 text-[17px]",
    mark: "text-[13px]",
    rule: "my-2.5",
  },
} as const;

export type PlateSize = keyof typeof SIZES;

/** Three letters then three digits: the only shape that earns the seam. */
const HANDLE = /^([A-Z]{3})([0-9]{3})$/;

export default function Plate({
  handle,
  size = "md",
  mark = true,
  className = "",
}: {
  handle: string;
  size?: PlateSize;
  /** The № outside the block. Dropped where the context already says it. */
  mark?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  const cased = handle.toUpperCase();
  const split = HANDLE.exec(cased);

  const cell = `flex items-center font-mono font-semibold tracking-[0.16em] tabular-nums ${s.cell}`;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark && (
        <span className={`font-medium tracking-wide text-mute ${s.mark}`}>
          №
        </span>
      )}

      <span
        className={`inline-flex items-stretch overflow-hidden rounded-plate bg-ink text-paper shadow-slab ${s.box}`}
      >
        <span className={`bg-gold/90 ${s.edge}`} aria-hidden />

        {split ? (
          <>
            <span className={cell}>{split[1]}</span>
            <span className={`w-px bg-paper/25 ${s.rule}`} aria-hidden />
            <span className={cell}>{split[2]}</span>
          </>
        ) : (
          // A genesis serial is six digits with no letters, so there is no
          // seam to draw. Set whole rather than split at an invented place.
          <span className={cell}>{cased}</span>
        )}
      </span>
    </span>
  );
}
