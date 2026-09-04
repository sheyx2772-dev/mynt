import DeviceFace from "@/components/DeviceFace";
import { CARD_DESIGNS } from "@/lib/card-designs";

// Supplier catalogues photograph a card range fanned out, and the reason is
// sound: it shows the whole set in one frame and reads as a range rather than
// six separate pictures. Same idea, drawn.
export default function CardFan({ handle }: { handle: string }) {
  const spread = CARD_DESIGNS.length - 1;

  return (
    <div className="relative mx-auto flex h-[300px] w-full max-w-xl items-center justify-center sm:h-[360px]">
      {CARD_DESIGNS.map((design, index) => {
        const offset = index - spread / 2;
        return (
          <div
            key={design.id}
            className="absolute w-[190px] origin-bottom transition-transform duration-500 hover:-translate-y-3 sm:w-[240px]"
            style={{
              transform: `rotate(${offset * 9}deg) translateX(${offset * 26}px) translateY(${Math.abs(offset) * 8}px)`,
              zIndex: index,
            }}
          >
            <DeviceFace type="card" design={design.id} handle={handle} />
          </div>
        );
      })}
    </div>
  );
}
