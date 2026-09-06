import { Nfc } from "lucide-react";

// The card itself, as an object.
//
// A profile is opened by touching a piece of plastic, and the first thing on
// the screen should be that piece of plastic. Not a photograph of one and not
// a banner cropped from one: the real artwork the owner chose, at the ratio it
// is actually cut to, with the number engraved on it and their name along the
// bottom edge.
//
// Everything here exists to make it read as a thing rather than a picture:
//
//   - the corner radius is a percentage, because a real card's corner is a
//     fixed physical radius and so scales with the card, not with the screen;
//   - it hangs slightly wider than the sheet beneath it, so the sheet reads as
//     having been slid underneath rather than butted up against it;
//   - the shadow has an inner highlight and an inner darkness, which is what
//     the lit and unlit edges of plastic look like;
//   - a diagonal sheen runs across it, brighter at the top left, because that
//     is where the light in this scene comes from;
//   - and it lands, once, on load.
//
// The gradient and the ring are separate layers rather than one, so a dark
// artwork and a pale one both keep their edge.
export default function CardObject({
  n,
  name,
  artwork,
  className = "",
}: {
  n: string;
  /** Engraved along the bottom edge, the way a bank card carries its holder. */
  name?: string | null;
  /** The design the owner actually bought. Null gives a plain black card. */
  artwork?: string | null;
  className?: string;
}) {
  return (
    <figure
      // The face is the theme's, not the component's: a suzani card is a deep
      // madder ground and a steel one is brushed metal, and neither is a
      // photograph. Artwork, where the owner bought a design that has some,
      // lies over it.
      className={`settle relative z-20 mx-auto w-[calc(100%-1.5rem)] max-w-[420px] overflow-hidden rounded-[4%/6.3%] shadow-card ${className}`}
      style={{ aspectRatio: "1.586 / 1", background: "var(--card-face)" }}
    >
      {artwork && (
        // eslint-disable-next-line @next/next/no-img-element -- a static file in public/, sized by CSS
        <img
          src={artwork}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-right opacity-90"
        />
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(112deg, rgb(255 255 255 / 0.10) 0%, rgb(255 255 255 / 0.02) 28%, rgb(0 0 0 / 0) 48%, rgb(0 0 0 / 0.18) 100%)",
        }}
      />
      {/* Two scrims, and they are not decoration.
          The engraving has to be legible on artwork we do not control — a
          gold map fills the whole card, a suzani is pale all over — so the
          corners the text sits in are darkened, hard at the bottom where the
          number is and gently at the top. Without this the number is only
          readable on the designs that happen to have a quiet corner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgb(0 0 0 / 0.62) 0%, rgb(0 0 0 / 0.18) 26%, rgb(0 0 0 / 0) 46%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 0% 0%, rgb(0 0 0 / 0.45) 0%, rgb(0 0 0 / 0) 55%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[4%/6.3%] ring-1 ring-white/10 ring-inset"
      />

      <div className="absolute inset-0 flex flex-col justify-between p-[5.5%]">
        <div className="flex items-start justify-between">
          <span className="engraved text-[clamp(14px,4.2vw,18px)] font-semibold tracking-[0.28em]">
            FLEX
          </span>
          <Nfc className="size-[clamp(20px,6vw,26px)] rotate-90 text-gold" />
        </div>

        <div className="flex items-end justify-between gap-4">
          {/* Sized in vw so the engraving scales with the card rather than
              with the page: on a 360px phone and on a desktop it stays the
              same size relative to the plastic. */}
          <span className="engraved font-mono text-[clamp(22px,7.2vw,32px)] font-semibold tracking-[0.14em] tabular-nums">
            {n}
          </span>
          {name && (
            <span className="engraved max-w-[45%] truncate text-right text-[clamp(12px,3.4vw,14px)] uppercase tracking-[0.18em]">
              {name}
            </span>
          )}
        </div>
      </div>
    </figure>
  );
}
