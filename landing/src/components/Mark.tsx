// The Flex mark: a point, and the signal leaving it.
//
// The shape is the contactless symbol, deliberately. The product is a card you
// tap, nobody in this market knows the name yet, and a mark that says what is
// being sold does more work than one that says who is selling it.
//
// One set of numbers, shared with the icon generator that draws the identical
// geometry into PNG for the manifest, the home screen and the bot. Changing a
// radius here changes it everywhere or nowhere.

/** Radii and stroke as fractions of a 100-unit box, so every renderer agrees. */
export const MARK = {
  originX: 27,
  originY: 50,
  dotRadius: 10,
  arcRadii: [26, 45],
  arcStroke: 11,
  /** Half the sweep, in radians. Wide enough to read, short of a full circle. */
  arcHalfSweep: 0.88,
} as const;

function arcPath(radius: number): string {
  const { originX, originY, arcHalfSweep } = MARK;
  const x = originX + radius * Math.cos(arcHalfSweep);
  const dy = radius * Math.sin(arcHalfSweep);
  return `M ${x.toFixed(2)} ${(originY - dy).toFixed(2)} A ${radius} ${radius} 0 0 1 ${x.toFixed(2)} ${(originY + dy).toFixed(2)}`;
}

/**
 * `tone` is the tile the glyph sits on, not the glyph itself.
 *
 * On a light page the tile is the brand's ink, which is what makes the mark
 * read as an object. On the dark header that tile would disappear into the
 * background, so there it becomes a hairline and a lift instead.
 */
export default function Mark({
  className = "size-7",
  tone = "light",
  signal = false,
}: {
  className?: string;
  tone?: "light" | "dark";
  /**
   * Runs the arcs outward, once every 1.4s.
   *
   * Only while something is genuinely pending — a page arriving, a tag being
   * written. A mark that animates permanently stops meaning anything, and the
   * one place it must never run is the header, where it would be moving on
   * every page all day.
   */
  signal?: boolean;
}) {
  return (
    <span
      className={`flex items-center justify-center rounded-plate ${
        tone === "dark" ? "border border-ink-line bg-ink-s1" : "bg-ink"
      } ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="h-[70%] w-[70%]" fill="none">
        <circle
          cx={MARK.originX}
          cy={MARK.originY}
          r={MARK.dotRadius}
          fill="var(--color-lime)"
        />
        {MARK.arcRadii.map((radius) => (
          <path
            key={radius}
            d={arcPath(radius)}
            stroke="var(--color-lime)"
            strokeWidth={MARK.arcStroke}
            strokeLinecap="round"
            className={signal ? "signal-arc" : undefined}
          />
        ))}
      </svg>
    </span>
  );
}
