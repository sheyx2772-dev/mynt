// The Flex mark: a point and the signal leaving it.
//
// It was five copies of the same span, so changing it meant finding all five.
// Now it is one component and one set of numbers, shared with the icon
// generator in scripts/make-icons.mjs — which draws the identical geometry into
// PNG for the manifest, the home screen and the bot.
//
// The shape is the contactless symbol, deliberately. The product is a card you
// tap, nobody in this market knows the name yet, and a mark that says what is
// being sold does more work than one that says who is selling it. It also keeps
// the dot the brand already had rather than discarding it.

/** Radii and stroke as fractions of a 100-unit box, so both renderers agree. */
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
  className = "h-6 w-6",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const tile =
    tone === "dark"
      ? "rounded-lg border border-white/15 bg-white/5"
      : "rounded-md bg-flex-black";

  return (
    <span className={`flex items-center justify-center ${tile} ${className}`} aria-hidden>
      <svg viewBox="0 0 100 100" className="h-[70%] w-[70%]" fill="none">
        <circle cx={MARK.originX} cy={MARK.originY} r={MARK.dotRadius} fill="var(--color-lime)" />
        {MARK.arcRadii.map((r) => (
          <path
            key={r}
            d={arcPath(r)}
            stroke="var(--color-lime)"
            strokeWidth={MARK.arcStroke}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </span>
  );
}
