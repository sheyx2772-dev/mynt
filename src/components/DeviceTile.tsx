import Image from "next/image";
import DeviceFace from "@/components/DeviceFace";
import { productShot, type ShotName } from "@/lib/product-shots";
import type { DeviceTypeId } from "@/lib/devices";

const SHOT_FOR: Record<DeviceTypeId, ShotName> = {
  card: "karta",
  ring: "uzuk",
  bracelet: "braslet",
};

// A device on a stage rather than in an empty box. With a photograph the stage
// takes the ground the shot was lit on, so the two meet without a seam; the
// drawn fallback keeps the dark stage it was built for.
export default function DeviceTile({
  type,
  alt,
}: {
  type: DeviceTypeId;
  alt: string;
}) {
  const shot = productShot(SHOT_FOR[type]);

  if (shot) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-black/8 bg-[#f9f9f9]">
        <Image
          src={shot}
          alt={alt}
          fill
          sizes="(min-width: 640px) 20rem, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grain relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_35%,#211a3c_0%,#0b0817_70%)] p-8">
      <div className="absolute inset-x-0 -top-10 h-40 bg-lime/10 blur-3xl" />
      <div className="relative">
        <DeviceFace type={type} design="genesis" handle="MYN042" />
      </div>
    </div>
  );
}
