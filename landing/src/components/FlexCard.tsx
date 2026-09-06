// The card, drawn rather than photographed.
//
// The photographs the old site shipped are 704×396 and 900×900 at source —
// not downsampled on the way here, that is what was produced. Shown at the
// size a hero wants, on a screen with two device pixels per CSS pixel, they
// are soft, and no amount of care in the markup fixes a small original.
//
// This is drawn, so it is sharp at any size and weighs nothing. It is also
// more honest about what is being sold: the object is black plastic with a
// gold edge and a number engraved on it, and the number is the product. A
// photograph of a card in a hand says something a drawing cannot, and that
// belongs further down the page where the claim is about using it — not here,
// where the claim is about owning a number.
//
// The ratio is the real one: ISO/IEC 7810 ID-1, 85.6 × 54 mm.
export default function FlexCard({
  handle = "AAA777",
  className = "",
}: {
  handle?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-tile bg-ink shadow-card ${className}`}
    >
      {/* The gold edge. A hairline inside the border rather than a border of
          its own, because on the real object it is the milled edge catching
          light, not a frame drawn around it. */}
      <div className="pointer-events-none absolute inset-0 rounded-tile ring-1 ring-gold/35 ring-inset" />

      {/* The light coming off the lime, at the corner it would come from. */}
      <div className="pointer-events-none absolute -top-1/3 -right-1/4 size-[70%] rounded-full bg-lime/12 blur-[70px]" />

      <div className="relative flex h-full flex-col justify-between p-[7%]">
        <div className="flex items-start justify-between">
          <span className="text-[clamp(0.75rem,3.2cqw,1rem)] font-semibold tracking-tight text-white">
            flex
          </span>

          {/* The contactless mark, at the corner the phone is held to. Drawn
              here rather than reusing the logo: on the card it is an
              instruction, not a signature. */}
          <svg
            viewBox="0 0 24 24"
            className="w-[9%] text-lime"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M5 8.5a9 9 0 0 1 0 7" />
            <path d="M9.5 6a13.5 13.5 0 0 1 0 12" />
            <path d="M14 3.5a18 18 0 0 1 0 17" />
          </svg>
        </div>

        <div>
          {/* The engraving. The one place the second font earns its download:
              a number read off a card and typed back in has to keep 0 and O
              apart. */}
          <div className="font-mono text-[clamp(1.1rem,7cqw,2.1rem)] leading-none font-semibold tracking-[0.22em] text-white">
            {handle}
          </div>
          <div className="mt-[3%] text-[clamp(0.5rem,2.2cqw,0.7rem)] tracking-[0.22em] text-paper-3 uppercase">
            arend.uz/{handle}
          </div>
        </div>
      </div>
    </div>
  );
}
