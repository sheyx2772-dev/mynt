"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import DeviceFace from "@/components/DeviceFace";
import { DEVICE_TYPES, type DeviceTypeId } from "@/lib/devices";
import { CARD_DESIGNS, type CardDesignId } from "@/lib/card-designs";

// One control for both halves of the choice: which object, and how it looks.
// They are shown together because the preview only makes sense as a pair —
// Naqsh on a ring is not the same picture as Naqsh on a card.
export default function DevicePicker({
  handle,
  device,
  design,
  customImage = null,
}: {
  handle: string;
  device: DeviceTypeId;
  design: CardDesignId;
  customImage?: string | null;
}) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceTypeId>(device);
  const [selectedDesign, setSelectedDesign] = useState<CardDesignId>(design);

  const legend = "mb-1.5 block text-xs font-medium tracking-wide text-flex-black/50 uppercase";

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={legend}>Qurilma</legend>
        <div className="grid grid-cols-3 gap-3">
          {DEVICE_TYPES.map((type) => {
            const active = selectedDevice === type.id;
            return (
              <label
                key={type.id}
                className={
                  active
                    ? "cursor-pointer rounded-2xl p-2 ring-2 ring-flex-black"
                    : "cursor-pointer rounded-2xl p-2 ring-1 ring-black/10 transition-colors hover:ring-black/25"
                }
              >
                <input
                  type="radio"
                  name="deviceType"
                  value={type.id}
                  checked={active}
                  onChange={() => setSelectedDevice(type.id)}
                  className="sr-only"
                />
                <DeviceFace
                  type={type.id}
                  design={selectedDesign}
                  handle={handle}
                  customImage={customImage}
                  compact
                />
                <span className="mt-1.5 flex items-center justify-between px-1 text-xs font-medium">
                  {type.name}
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Dizayn</legend>
        <div className="flex flex-wrap gap-2">
          {CARD_DESIGNS.map((d) => {
            const active = selectedDesign === d.id;
            return (
              <label
                key={d.id}
                className={
                  active
                    ? "cursor-pointer rounded-full bg-flex-black px-4 py-2 text-sm font-medium text-white"
                    : "cursor-pointer rounded-full border border-black/10 px-4 py-2 text-sm text-flex-black/60 transition-colors hover:bg-black/[0.03]"
                }
              >
                <input
                  type="radio"
                  name="cardDesign"
                  value={d.id}
                  checked={active}
                  onChange={() => setSelectedDesign(d.id)}
                  className="sr-only"
                />
                {d.name}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-flex-black/35">
          Tanlovingiz qurilmangizga tushadi. Istalgan vaqtda almashtirasiz.
        </p>
      </fieldset>
    </div>
  );
}
