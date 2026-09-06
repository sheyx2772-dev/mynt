import Image from "next/image";

import {
  ACCENT_CLASS,
  cardDesign,
  designAccent,
  type CardDesignId,
} from "@/lib/card-designs";
import { SKINS } from "@/lib/card-skins";
import { SITE_HOST } from "@/lib/site";

// One card, in one design.
//
// The artwork under `public/kartalar` is the design and nothing else — no
// handle, no address, no wordmark. Those three are drawn here, over whichever
// ground the design brings, which is what lets one 1200x757 file serve every
// buyer who picks it. It also means this component is the only place that knows
// what is engraved on a card, so the catalogue, a cabinet preview and an order
// confirmation cannot end up printing three different things.
//
// `@container` rather than a size prop: the same face is drawn at 340px in a
// catalogue grid and at full width on a phone, and every measurement on it —
// the padding, the engraving, the contactless mark — is a fraction of the
// card's own width, as it is on the real object. A card scaled by breakpoint
// gets a 12px wordmark on a 340px face and a 12px wordmark on a 600px one.

export default function CardFace({
  design,
  handle,
  sizes,
}: {
  design: CardDesignId;
  handle: string;
  /**
   * How wide the face actually renders, for the four artwork-backed designs.
   *
   * The files are 1200px across. Asking for a box wider than that is asking
   * for pixels the file does not hold, and what arrives is a soft card — the
   * one failure this page cannot afford, since the card is the product.
   */
  sizes: string;
}) {
  const catalogue = cardDesign(design);
  const skin = SKINS[design];

  const ink = skin.light ? "text-ink" : "text-white";
  const muted = skin.light ? "text-ink/45" : "text-white/45";

  // On a light face the dot is struck in ink rather than in the design's own
  // accent, and it has to be: `lime` puts a lime dot on the lime card and
  // `paper` a pale steel one on white, so the one mark of colour the face
  // carries is the one thing on it nobody can see. The accent still decides
  // what the profile opens in — that is a fact about the card, not about the
  // contrast of this drawing.
  const dot = skin.light ? "bg-ink" : ACCENT_CLASS[designAccent(design)];

  return (
    <div
      className={`@container relative isolate aspect-[1.586/1] w-full overflow-hidden rounded-card shadow-card ${skin.ground}`}
    >
      {catalogue.image ? (
        <Image
          src={catalogue.image}
          alt=""
          fill
          sizes={sizes}
          quality={90}
          className="-z-10 object-cover"
        />
      ) : (
        skin.overlay && (
          <div className="absolute inset-0 -z-10" style={skin.overlay} />
        )
      )}

      <div className="flex h-full flex-col justify-between p-[6.5%]">
        <div className="flex items-start justify-between">
          <span
            className={`text-[clamp(0.6rem,3.4cqw,1rem)] leading-none font-semibold tracking-tight ${ink}`}
          >
            flex
          </span>

          {/* The contactless mark, at the corner a phone is held to — unless
              the artwork already printed one, in which case drawing a second
              puts two contactless symbols in the same corner of one card. */}
          {!catalogue.artworkHasNfc && (
            <svg
              viewBox="0 0 24 24"
              className={`w-[9%] ${muted}`}
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
          )}
        </div>

        <div>
          <div className="flex items-center gap-[2.5%]">
            {/* The accent, and the only place on the face it appears. A card
                finished in gold says so once. */}
            <span
              className={`size-[2.2cqw] shrink-0 rounded-full ${dot}`}
              aria-hidden="true"
            />
            <span
              className={`truncate font-mono text-[clamp(0.85rem,6cqw,2rem)] leading-none font-semibold tracking-[0.2em] ${ink}`}
            >
              {handle}
            </span>
          </div>
          <div
            className={`mt-[3%] truncate text-[clamp(0.45rem,2.1cqw,0.7rem)] tracking-[0.2em] uppercase ${muted}`}
          >
            {SITE_HOST}/{handle}
          </div>
        </div>
      </div>
    </div>
  );
}
