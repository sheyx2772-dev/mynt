import Image from "next/image";
import DeviceFace from "@/components/DeviceFace";
import { productShot, type ShotName } from "@/lib/product-shots";
import type { DeviceTypeId } from "@/lib/devices";

const SHOT_FOR: Record<DeviceTypeId, ShotName> = {
  card: "karta",
  ring: "uzuk",
  bracelet: "braslet",
};

// A device on a lit stage rather than in an empty white box. The stage is dark
// because the product is: a black object photographed on white loses its edges.
export default function DeviceTile({
  type,
  alt,
}: {
  type: DeviceTypeId;
  alt: string;
}) {
  const shot = productShot(SHOT_FOR[type]);

  return (
    <div className="grain relative aspect-square overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_35%,#211a3c_0%,#0b0817_70%)]">
      <div className="absolute inset-x-0 -top-10 h-40 bg-lime/10 blur-3xl" />
      {shot ? (
        <Image
          src={shot}
          alt={alt}
          fill
          sizes="(min-width: 640px) 20rem, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="relative flex h-full items-center justify-center p-8">
          <DeviceFace type={type} design="genesis" handle="MYN042" />
        </div>
      )}
    </div>
  );
}
