import Image from "next/image";
import { Nfc } from "lucide-react";
import { SKINS } from "@/lib/device-skins";
import { cardDesign, type CardDesignId } from "@/lib/card-designs";
import type { DeviceTypeId } from "@/lib/devices";

// The same handle rendered on whichever object its owner chose to carry it.
// Drawn rather than photographed: there is no product photography yet, and a
// drawing that is honestly a drawing beats a stock image of someone else's
// card.

type FaceProps = { design: CardDesignId; handle: string; compact?: boolean };

function Card({ design, handle, compact }: FaceProps) {
  const skin = SKINS[design];
  const art = cardDesign(design);
  return (
    <div
      className={`relative isolate aspect-[1.586] w-full overflow-hidden ${compact ? "rounded-lg p-2" : "rounded-2xl p-5"} ${skin.shell} ${skin.ink} shadow-[0_20px_40px_-24px_rgba(14,10,27,0.5)]`}
    >
      {art.image ? (
        <Image
          src={art.image}
          alt=""
          fill
          sizes="(min-width: 640px) 24rem, 100vw"
          className="-z-10 object-cover"
        />
      ) : (
        skin.overlay && <div className="absolute inset-0 -z-10" style={skin.overlay} />
      )}
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span
            className={`${compact ? "text-[6px] tracking-[0.12em]" : "text-[10px] tracking-[0.18em]"} font-medium uppercase ${skin.muted}`}
          >
            FLEX
          </span>
          {/* The NFC mark sits in a recessed disc, as it does on a real card —
              unless the artwork already printed one, in which case drawing a
              second would put two contactless symbols in the same corner. */}
          {!art.artworkHasNfc && (
            <span
              className={`flex items-center justify-center rounded-full ${compact ? "h-3.5 w-3.5" : "h-7 w-7"}`}
              style={{
                background: "rgba(0,0,0,0.35)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6), 0 0.5px 0 rgba(255,255,255,0.08)",
              }}
            >
              <Nfc className={`${compact ? "h-2 w-2" : "h-3.5 w-3.5"} ${skin.muted}`} />
            </span>
          )}
        </div>
        <div>
          <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
            <span
              className={`${compact ? "h-1 w-1" : "h-2 w-2"} shrink-0 rounded-full ${skin.accent}`}
            />
            <span
              className={`truncate font-display font-semibold tracking-tight ${compact ? "text-[10px]" : "text-xl"} ${skin.ink}`}
            >
              {handle}
            </span>
          </div>
          {!compact && (
            <p className={`mt-1 font-tabular text-[11px] ${skin.muted}`}>flex.com.uz/{handle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Ring({ design, handle, compact }: FaceProps) {
  const skin = SKINS[design];
  return (
    <div className={`flex aspect-[1.586] w-full flex-col items-center justify-center ${compact ? "gap-1" : "gap-3"}`}>
      <div className="relative">
        {/* The band. The hole is punched with a mask so whatever is behind
            the component shows through, as it would on a finger. */}
        <div
          className={`relative isolate ${compact ? "h-9 w-9" : "h-[104px] w-[104px]"} overflow-hidden rounded-full ${skin.shell} shadow-[0_18px_34px_-18px_rgba(14,10,27,0.6)]`}
          style={{
            maskImage: "radial-gradient(circle, transparent 42%, black 43%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 42%, black 43%)",
          }}
        >
          {skin.overlay && <div className="absolute inset-0 -z-10" style={skin.overlay} />}
          {/* Curvature: a specular sweep across the band, the inner wall in
              shadow, and a bright rim where the metal turns over. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(from 205deg, rgba(255,255,255,0.34), rgba(255,255,255,0.04) 22%, transparent 46%, rgba(255,255,255,0.10) 68%, rgba(255,255,255,0.30) 88%, rgba(255,255,255,0.34))",
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 -6px 12px rgba(0,0,0,0.55)",
            }}
          />
        </div>
        <span
          className={`absolute left-1/2 -translate-x-1/2 rounded-full ${compact ? "top-0.5 h-1 w-1" : "top-1.5 h-2 w-2"} ${skin.accent}`}
        />
      </div>
      <p className={`font-display font-semibold tracking-tight ${compact ? "text-[9px]" : "text-sm"}`}>
        {handle}
      </p>
    </div>
  );
}

function Bracelet({ design, handle, compact }: FaceProps) {
  const skin = SKINS[design];
  return (
    <div className="flex aspect-[1.586] w-full items-center justify-center">
      <div className={`relative w-full ${compact ? "max-w-[76px]" : "max-w-[230px]"}`}>
        {/* The strap, tapering at both ends so it reads as wrapping away. */}
        <div
          className={`relative isolate mx-auto w-full overflow-hidden rounded-full ${compact ? "h-3.5" : "h-9"} ${skin.shell} shadow-[0_16px_30px_-20px_rgba(14,10,27,0.6)]`}
        >
          {skin.overlay && <div className="absolute inset-0 -z-10" style={skin.overlay} />}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18), transparent 40%, rgba(0,0,0,0.28)), linear-gradient(90deg, rgba(0,0,0,0.35), transparent 18%, transparent 82%, rgba(0,0,0,0.35))",
            }}
          />
        </div>

        {/* The plate, sitting proud of the strap. */}
        <div
          className={`absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center ${compact ? "h-5 gap-1 rounded-lg px-1.5" : "h-11 gap-2 rounded-2xl px-4"} ${skin.shell} shadow-[0_8px_18px_-8px_rgba(14,10,27,0.75)] ring-1 ring-white/20`}
        >
          {skin.overlay && <div className="absolute inset-0 -z-10 rounded-2xl" style={skin.overlay} />}
          <span
            className={`shrink-0 rounded-full ${compact ? "h-1 w-1" : "h-1.5 w-1.5"} ${skin.accent}`}
          />
          <span
            className={`truncate font-display font-semibold tracking-tight ${compact ? "text-[8px]" : "text-sm"} ${skin.ink}`}
          >
            {handle}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DeviceFace({
  type,
  design,
  handle,
  compact = false,
}: {
  type: DeviceTypeId;
  design: CardDesignId;
  handle: string;
  compact?: boolean;
}) {
  const props = { design, handle, compact };
  if (type === "ring") return <Ring {...props} />;
  if (type === "bracelet") return <Bracelet {...props} />;
  return <Card {...props} />;
}
