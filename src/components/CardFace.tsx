import { Nfc } from "lucide-react";
import type { CardDesignId } from "@/lib/card-designs";

// A card face at the real aspect ratio of a bank card (85.6 x 54 mm).
// Rendered rather than photographed, so it stays sharp at any size and the
// owner's own handle appears on the preview.

type Skin = {
  shell: string;
  ink: string;
  muted: string;
  accent: string;
  overlay?: React.CSSProperties;
};

const SKINS: Record<CardDesignId, Skin> = {
  genesis: {
    shell: "grain bg-flex-black",
    ink: "text-white",
    muted: "text-white/45",
    accent: "bg-lime",
  },
  lime: {
    shell: "bg-lime",
    ink: "text-flex-black",
    muted: "text-flex-black/50",
    accent: "bg-flex-black",
  },
  grid: {
    shell: "bg-flex-black bg-dot-grid-light",
    ink: "text-white",
    muted: "text-white/45",
    accent: "bg-lime",
  },
  sheen: {
    shell: "card-sheen bg-flex-black",
    ink: "text-white",
    muted: "text-white/45",
    accent: "bg-lime",
    overlay: {
      backgroundImage:
        "linear-gradient(115deg, transparent 30%, rgba(171,255,9,0.22) 48%, transparent 62%)",
    },
  },
  naqsh: {
    shell: "bg-flex-black",
    ink: "text-white",
    muted: "text-white/40",
    accent: "bg-lime",
    // Two square lattices, one rotated 45 degrees, which is how an
    // eight-pointed star is constructed. Drawn from gradients, not traced
    // from any existing artwork.
    overlay: {
      backgroundImage: [
        "repeating-linear-gradient(0deg, rgba(171,255,9,0.16) 0 1px, transparent 1px 34px)",
        "repeating-linear-gradient(90deg, rgba(171,255,9,0.16) 0 1px, transparent 1px 34px)",
        "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 24px)",
        "repeating-linear-gradient(-45deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 24px)",
      ].join(","),
    },
  },
  paper: {
    shell: "border border-black/12 bg-[#fbfbf9]",
    ink: "text-flex-black",
    muted: "text-flex-black/40",
    accent: "bg-flex-black",
  },
};

export default function CardFace({
  design,
  handle,
  label = "FLEX CARD",
}: {
  design: CardDesignId;
  handle: string;
  label?: string;
}) {
  const skin = SKINS[design];

  return (
    <div
      className={`relative isolate aspect-[1.586] w-full overflow-hidden rounded-2xl p-5 ${skin.shell} ${skin.ink} shadow-[0_20px_40px_-24px_rgba(14,10,27,0.5)]`}
    >
      {skin.overlay && <div className="absolute inset-0 -z-10" style={skin.overlay} />}

      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className={`text-[10px] font-medium tracking-[0.18em] uppercase ${skin.muted}`}>
            {label}
          </span>
          <Nfc className={`h-4 w-4 ${skin.muted}`} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${skin.accent}`} />
            <span className={`font-display text-xl font-semibold tracking-tight ${skin.ink}`}>
              {handle}
            </span>
          </div>
          <p className={`mt-1 font-tabular text-[11px] ${skin.muted}`}>flex.uz/{handle}</p>
        </div>
      </div>
    </div>
  );
}
