import type { CardDesignId } from "@/lib/card-designs";

// The palette each design paints with, shared by every form factor so a ring
// and a card in the same design are recognisably the same object.
export type Skin = {
  shell: string;
  ink: string;
  muted: string;
  accent: string;
  overlay?: React.CSSProperties;
};

export const SKINS: Record<CardDesignId, Skin> = {
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
    // eight-pointed star is constructed.
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
  // Artwork-backed designs. The shell is the ink the printed image is darkest
  // in, so the overlaid handle stays legible while the artwork loads and on the
  // ring and bracelet, which have no room for a photograph.
  rahbar: {
    shell: "bg-[#0b0b0c]",
    ink: "text-white",
    muted: "text-white/55",
    accent: "bg-white/70",
  },
  devops: {
    shell: "bg-[#131417]",
    ink: "text-white",
    muted: "text-white/55",
    accent: "bg-lime",
  },
  suzani: {
    shell: "bg-[#2b2a5e]",
    ink: "text-white",
    muted: "text-white/60",
    accent: "bg-[#d9b26a]",
  },
  xarita: {
    shell: "bg-[#0d0d0e]",
    ink: "text-white",
    muted: "text-white/55",
    accent: "bg-[#d9b26a]",
  },
};
