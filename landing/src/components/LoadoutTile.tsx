import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { productShot, type ShotName } from "@/lib/product-shots";

// One item on the shelf.
//
// Big picture, name over it, price in the corner — the shape a game uses to
// let somebody choose a thing without reading. The photograph is the control;
// the words underneath confirm what was already decided by looking.
//
// Every tile keeps its dark ground whether or not a photograph exists, so a
// missing shot leaves a gap in the row rather than a differently-coloured tile.

export default function LoadoutTile({
  href,
  shot,
  name,
  note,
  price,
  wide = false,
}: {
  href: string;
  shot: ShotName | null;
  name: string;
  note: string;
  /** Rendered as given — a formatted sum, or the words for "ask us". */
  price: string;
  wide?: boolean;
}) {
  const src = shot ? productShot(shot) : null;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-flex-black ring-1 ring-white/10 transition-transform active:scale-[0.99] hover:-translate-y-0.5 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div
        className={`relative w-full overflow-hidden ${wide ? "aspect-[16/9]" : "aspect-square"}`}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            fill
            sizes="(min-width: 640px) 22rem, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#211a3c_0%,#0b0817_70%)]">
            <div className="absolute inset-x-0 -top-8 h-32 bg-lime/10 blur-3xl" />
          </div>
        )}

        {/* The name sits on the picture, not under it, so the tile reads as one
            object rather than an image with a caption. */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-flex-black via-flex-black/70 to-transparent px-4 pt-10 pb-3">
          <p className="font-display text-base leading-tight font-semibold text-white">
            {name}
          </p>
          <p className="mt-0.5 text-[11px] tracking-wide text-white/45 uppercase">{note}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-tabular text-sm font-medium text-lime">{price}</span>
        <ChevronRight className="h-4 w-4 text-white/35 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
